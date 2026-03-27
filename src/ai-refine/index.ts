import { parse, basename, isAbsolute, resolve } from "node:path";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { inferMetadata } from "../enrich";
import { RecordCandidate, RecordCandidateWithRefinedMetadata, RepoFile, RuleInference } from "../types";
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function normalizeComparable(value: string | null | undefined): string {
    if (!value) return "";
    return String(value).trim().toLowerCase();
}

async function retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    options?: {
        retries?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
    },
): Promise<T> {
    const retries = options?.retries ?? 5;
    const baseDelayMs = options?.baseDelayMs ?? 500;
    const maxDelayMs = options?.maxDelayMs ?? 30_000;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await fn();
        } catch (err: any) {
            const status = err?.status;
            const code = err?.code;
            const isRetryable =
                status === 429 ||
                (typeof status === "number" && status >= 500 && status < 600) ||
                code === "ETIMEDOUT" ||
                code === "ECONNRESET" ||
                code === "ECONNREFUSED";

            if (!isRetryable || attempt === retries) {
                throw err;
            }

            const delay = Math.min(
                maxDelayMs,
                baseDelayMs * 2 ** attempt + Math.random() * 300,
            );
            console.warn(`Retryable error (attempt ${attempt + 1}/${retries}) - waiting ${Math.round(delay)}ms`, err?.message || err);
            await wait(delay);
        }
    }

    // should never reach here
    return fn();
}

const COMPRESSED_EXTENSIONS = new Set(["7z", "zip", "tar", "gz", "bz2", "xz", "rar"]);
const AI_SUPPORTED_EXTENSIONS = new Set([
    "txt", "md", "json", "ts", "js", "py", "java", "c", "cpp", "h", "rs", "go", "sh",
    "yaml", "yml", "html", "htm", "csv", "pdf"
]);

function isAllowedForAI(extension: string | null | undefined): boolean {
    if (!extension) return false;
    const ext = String(extension).trim().toLowerCase();

    if (COMPRESSED_EXTENSIONS.has(ext)) return false;
    return AI_SUPPORTED_EXTENSIONS.has(ext);
}

function isGenericDisciplina(value: string | null | undefined): boolean {
    if (!value) return true;
    const v = normalizeComparable(value);
    return v === "geral" || v.startsWith("outros - prof") || /grade s\d{2}/.test(v);
}

function isGenericImageName(value: string | null | undefined): boolean {
    if (!value) return false;
    const v = normalizeComparable(value);
    return /^img_/.test(v) || /^photo_/.test(v) || /^p_\d{8}_\d{6}/.test(v);
}

function isLikelyWeakTitle(value: string | null | undefined): boolean {
    if (!value) return true;
    const v = normalizeComparable(value);
    return v.length === 0 || /^\d+$/.test(v) || /^(?:n|av|ap|p)\s*[1-4]$/.test(v) || v === "prova";
}

const WELL_KNOWN_TIPOS = new Set([
    "prova",
    "lista de exercícios",
    "material de aula",
    "documentação",
    "trabalho/projeto",
    "plano de ensino",
    "gabarito/resolução",
    "resumo",
    "administrativo/estágio",
    "material complementar",
]);

export function computeRuleScore(rule: RuleInference | RecordCandidate): RuleInference & { score: number; reasons: string[] } {
    const disciplina = normalizeComparable((rule as any).disciplina ?? "");
    const tipo = normalizeComparable((rule as any).tipo ?? "");
    const semester = normalizeComparable((rule as any).semester ?? "");
    const title = normalizeComparable((rule as any).title ?? "");

    let score = 0;
    const reasons: string[] = [];

    if (disciplina && !isGenericDisciplina(disciplina)) {
        score += 50;
        reasons.push("disciplina inferida");
    }
    if (isGenericDisciplina(disciplina)) {
        score -= 25;
        reasons.push("disciplina genérica");
    }
    if (tipo && WELL_KNOWN_TIPOS.has(tipo)) {
        score += 25;
        reasons.push("tipo conhecido");
    }
    if (semester && /^(?:19|20)\d{2}\.[12]$/.test(semester)) {
        score += 30;
        reasons.push("semestre explícito");
    } else if (semester && /^(?:19|20)\d{2}$/.test(semester)) {
        score += 15;
        reasons.push("ano explícito");
    } else if (semester && /grade s\d{2}/.test(normalizeComparable(semester))) {
        score += 10;
        reasons.push("grade de semestre");
    }

    if (isGenericImageName((rule as any).title)) {
        score -= 20;
        reasons.push("nome de imagem genérico");
    }

    if (isLikelyWeakTitle((rule as any).title)) {
        score -= 20;
        reasons.push("título fraco");
    }

    if (title.includes("pud") || title.includes("plano de ensino")) {
        score += 10;
        reasons.push("PUD/Plano de Ensino identificado");
    }

    const bounded = Math.max(0, Math.min(100, score));

    return {
        ...rule,
        score: bounded,
        reasons,
        disciplina: (rule as any).disciplina ?? null,
        tipo: (rule as any).tipo ?? null,
        semester: (rule as any).semester ?? null,
        title: (rule as any).title ?? "",
    };
}

export function shouldUseAI(scored: RuleInference & { score: number; reasons: string[] }): boolean {
    if (scored.score <= 80) return true;
    if (!scored.disciplina || isGenericDisciplina(scored.disciplina)) return true;
    return false;
}

export function buildAIPrompt(input: {
    path: string;
    name: string;
    extension: string;
    rule: RuleInference & { score: number; reasons: string[] };
}): string {
    return `A partir deste arquivo, identifique disciplina, tipo e semestre com o máximo de precisão:

Caminho: ${input.path}
Nome: ${input.name}
Extensão: ${input.extension}
Disciplina atual: ${input.rule.disciplina ?? "null"}
Tipo atual: ${input.rule.tipo ?? "null"}
Semestre atual: ${input.rule.semester ?? "null"}
Score: ${input.rule.score}
Motivos: ${input.rule.reasons.join("; ")}

Retorne JSON puro: {"disciplina": ..., "tipo": ..., "semester": ...} (use null se nenhum valor)
`;
}

export async function callLLM(prompt: string, file: RepoFile): Promise<{ disciplina: string | null; tipo: string | null; semester: string | null }> {
    // Stub local. Substitua por chamada real ao seu LLM preferido.
    // Use ai do Gemini

    try {
        const absolutePath = isAbsolute(file.path) ? file.path : resolve(process.cwd(), file.path);
        const mimeType = fromExtensionToMime(file.extension);
        const displayName = basename(file.path);
        const name = createUniqueUploadResourceName(displayName);

        const uploadConfig: any = {
            name,
            displayName,
        };

        if (mimeType) {
            uploadConfig.mimeType = mimeType;
        }

        const uploadedFile = await ai.files.upload({
            file: absolutePath,
            config: uploadConfig,
        });

        await waitForActiveFile(uploadedFile);

        const fileData: any = {
            fileUri: uploadedFile.uri,
        };

        if (mimeType) {
            fileData.mimeType = mimeType;
        }

        const response = await retryWithExponentialBackoff(() =>
            ai.models.generateContent({
                model: "gemini-2.5-flash",
                config: {
                    responseJsonSchema: {
                        type: "object",
                        properties: {
                            disciplina: { type: "string" },
                            tipo: { type: "string" },
                            semester: { type: "string" },
                        },
                        required: ["disciplina", "tipo", "semester"],
                    }
                },
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt
                            },
                            {
                                text: JSON.stringify(file) // Enviar os dados do arquivo como parte do prompt para ajudar na inferência
                            },
                            {
                                fileData
                            }
                        ]
                    }
                ]
            }),
            {
                retries: 5,
                baseDelayMs: 500,
                maxDelayMs: 30_000,
            },
        );

        const parsed = parseLLMResponse(response);
        return parsed;
    } catch (error) {
        console.error("Erro ao chamar LLM:", error);
        return {
            disciplina: null,
            tipo: null,
            semester: null,
        };
    }
}

export function computeFinalScore(
    disciplina: string | null,
    tipo: string | null,
    semester: string | null,
    base: RuleInference & { score: number; reasons: string[] },
): number {
    let final = base.score;

    if (disciplina && !isGenericDisciplina(disciplina)) final += 15;
    if (tipo && WELL_KNOWN_TIPOS.has(normalizeComparable(tipo))) final += 10;
    if (semester && /^(?:19|20)\d{2}\.[12]$/.test(normalizeComparable(semester))) final += 10;

    final = Math.max(0, Math.min(100, final));
    return final;
}

export async function refineMetadata(
    file: RepoFile,
    options?: {
        llmCaller?: (prompt: string) => Promise<{ disciplina: string | null; tipo: string | null; semester: string | null }>;
    },
): Promise<RecordCandidateWithRefinedMetadata> {
    const raw = inferMetadata(file) || {
        title: file.name,
        sourcePath: file.path,
        tipo: null,
        disciplina: null,
        semester: null,
        tags: [],
    };

    const base: RuleInference = {
        title: raw.title,
        disciplina: raw.disciplina ?? null,
        tipo: raw.tipo ?? null,
        semester: raw.semester ?? null,
        score: 0,
        reasons: [],
    };

    const scored = computeRuleScore(base);

    if (!shouldUseAI(scored)) {
        return {
            ...raw,
            scoreMetadata: {
                score: scored.score,
                source: "rule",
                reasons: scored.reasons,
            },
        };
    }

    // Ignore unsupported/compressed files at metadata refinement stage.
    if (!isAllowedForAI(file.extension)) {
        return {
            ...raw,
            scoreMetadata: {
                score: scored.score,
                source: "rule",
                reasons: [...scored.reasons, "skipped unsupported file type"],
            },
        };
    }

    const prompt = buildAIPrompt({ path: file.path, name: file.name, extension: file.extension, rule: scored });
    const ai = await (options?.llmCaller ?? callLLM)(prompt, file);

    const finalDisciplina = ai.disciplina ?? scored.disciplina;
    const finalTipo = ai.tipo ?? scored.tipo;
    const finalSemester = ai.semester ?? scored.semester;

    const finalScore = computeFinalScore(finalDisciplina, finalTipo, finalSemester, scored);

    return {
        ...raw,
        disciplina: finalDisciplina ?? undefined,
        tipo: finalTipo ?? undefined,
        semester: finalSemester ?? undefined,
        scoreMetadata: {
            score: finalScore,
            source: "ai",
            reasons: [...scored.reasons, "ai fallback", ...(ai.disciplina ? [] : ["ai não sugeriu disciplina"])],
        },
    };
}
    

function fromExtensionToMime(extension: string): string | undefined {
    const ext = String(extension ?? "").trim().toLowerCase();
    switch (ext) {
        case "pdf": return "application/pdf";
        case "doc":
        case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        case "xls":
        case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        case "ppt":
        case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        case "jpg":
        case "jpeg": return "image/jpeg";
        case "png": return "image/png";
        case "txt":
        case "md":
        case "json":
        case "ts":
        case "js":
        case "py":
        case "java":
        case "c":
        case "cpp":
        case "h":
        case "rs":
        case "go":
        case "sh": return "text/plain";
        case "yaml":
        case "yml": return "application/x-yaml";
        case "html":
        case "htm": return "text/html";
        case "csv": return "text/csv";
        case "zip": return "application/zip";
        default: return undefined;
    }
}

function parseLLMResponse(response: GenerateContentResponse): {
    disciplina: string | null;
    tipo: string | null;
    semester: string | null;
} {
    try {
        const content = response.candidates[0]?.content;
        if (!content) {
            throw new Error("Resposta da LLM não contém conteúdo");
        }
        const textPart = content.parts.find(part => "text" in part) as { text: string } | undefined;
        if (!textPart) {
            throw new Error("Resposta da LLM não contém parte de texto");
        }

        let raw = String(textPart.text || "").trim();
        const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (fencedMatch) {
            raw = fencedMatch[1].trim();
        }

        return JSON.parse(raw);
    } catch (error) {
        console.error("Erro ao parsear resposta da LLM:", error);
        return {
            disciplina: null,
            tipo: null,
            semester: null,
        };
    }
}

function normalizeFileResourceName(name: string): string {
    if (!name) {
        return "file";
    }
    const normalized = String(name)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return normalized || "file";
}

function createUniqueUploadResourceName(baseName: string): string {
    const clean = normalizeFileResourceName(baseName);
    const randomSuffix = randomUUID().replace(/[^a-z0-9]/g, "").slice(0, 8) || "rnd";
    const maxPrefixLength = 40 - 1 - randomSuffix.length; // 1 for dash
    const prefix = clean.slice(0, Math.max(1, maxPrefixLength));
    return `${prefix}-${randomSuffix}`;
}

async function waitForActiveFile(file) {
    let attempts = 0;
    while (file.state !== "ACTIVE") {
        if (file.state === "FAILED") {
            const details = file.error || file.failureReason || "unknown reason";
            throw new Error(`File processing failed: ${file.name} (${details})`);
        }

        attempts += 1;
        if (attempts > 30) {
            throw new Error(`File processing timed out: ${file.name} (last state: ${file.state})`);
        }

        console.log("Polling state:", file.state);
        await wait(5_000); // non‑blocking delay
        file = await ai.files.get({ name: file.name });
    }
    return file;
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
