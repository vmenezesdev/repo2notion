import { parse, basename, isAbsolute, resolve } from "node:path";
import { randomUUID } from "crypto";
import { stat } from "node:fs/promises";
import { inferMetadata } from "../enrich";
import { RecordCandidate, RecordCandidateWithRefinedMetadata, RepoFile, RuleInference } from "../types";

let aiClientPromise: Promise<any> | null = null;

async function getAIClient(): Promise<any> {
    if (!aiClientPromise) {
        aiClientPromise = import("@google/genai").then(({ GoogleGenAI }) => {
            return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        });
    }
    return aiClientPromise;
}
const DEFAULT_MAX_AI_FILE_BYTES = 20 * 1024 * 1024;
const DEFAULT_MAX_AI_FILE_METADATA_CHARS = 1_500;
const MAX_AI_FILE_BYTES = getPositiveIntFromEnv(process.env.AI_MAX_FILE_BYTES) ?? DEFAULT_MAX_AI_FILE_BYTES;
const MAX_AI_FILE_METADATA_CHARS = getPositiveIntFromEnv(process.env.AI_MAX_FILE_METADATA_CHARS) ?? DEFAULT_MAX_AI_FILE_METADATA_CHARS;

function normalizeComparable(value: string | null | undefined): string {
    if (!value) return "";
    return String(value).trim().toLowerCase();
}

function getPositiveIntFromEnv(value: string | undefined): number | null {
    if (!value) return null;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
}

function buildLLMFallbackResult(): { disciplina: string | null; tipo: string | null; semester: string | null; title: string | null } {
    return {
        disciplina: null,
        tipo: null,
        semester: null,
        title: null,
    };
}

function isLikelyLLMInputLimitError(error: any): boolean {
    const status = Number(error?.status ?? error?.error?.status ?? 0);
    const code = normalizeComparable(String(error?.code ?? error?.error?.code ?? ""));
    const message = normalizeComparable(
        String(error?.message ?? error?.error?.message ?? ""),
    );

    if (status === 413) return true;

    const mightBeInvalidArgument = status === 400 || code === "invalid_argument";
    if (!mightBeInvalidArgument) return false;

    const knownLimitHints = [
        "page limit",
        "too many pages",
        "document contains",
        "exceeds the supported",
        "exceeds the maximum",
        "too large",
        "input too long",
        "token limit",
        "context window",
        "request too large",
        "payload too large",
        "size limit",
    ];

    return knownLimitHints.some((hint) => message.includes(hint));
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
    "yaml", "yml", "html", "htm", "csv", "pdf", "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "heic"
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

function removeExtension(value: string | null | undefined): string {
    if (!value) return "";
    return String(value).replace(/\.[^/.]+$/, "");
}

function isLikelyDateLikeName(value: string | null | undefined): boolean {
    if (!value) return false;
    const normalized = normalizeComparable(removeExtension(value));
    if (!normalized) return false;

    return /\b(?:19|20)\d{2}[._/-]?\d{1,2}[._/-]?\d{1,2}(?:[t\s_-]?\d{2}[._:-]\d{2}(?:[._:-]\d{2})?)?\b/i.test(normalized);
}

function isGarbageIdLikeName(value: string | null | undefined): boolean {
    if (!value) return false;

    const normalized = removeExtension(String(value)).trim();
    if (!normalized) return false;

    const comparable = normalizeComparable(normalized);

    if (isLikelyDateLikeName(normalized)) {
        const cameraTimestampLike = /^(?:p|img|dsc|photo|whatsapp|screenshot|snapshot|scan|captura|pxl)[\s._-]*\d+/i.test(comparable);
        return cameraTimestampLike;
    }

    if (/^[\d_\-\s]{10,}$/.test(normalized)) {
        return true;
    }

    const compact = normalized.replace(/\s+/g, "");
    if (/^\d{10,}[a-z]?$/i.test(compact)) {
        return true;
    }

    const idSuffixMatch = normalized.match(/[\s_.\-]{1,3}(\d{8,})$/);
    if (idSuffixMatch) {
        const prefix = normalized.slice(0, idSuffixMatch.index).trim();
        if (/[A-Za-zÀ-ÿ]{3,}/.test(prefix)) {
            return true;
        }
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length >= 3 && tokens.every((token) => /^\d+[a-z]?$/i.test(token))) {
        return true;
    }

    const digitCount = (normalized.match(/\d/g) ?? []).length;
    const letterCount = (normalized.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
    return digitCount >= 10 && letterCount <= 2;
}

function isOriginalFileNameTitle(title: string | null | undefined, fileName: string | null | undefined): boolean {
    const normalizedTitle = normalizeComparable(removeExtension(title));
    const normalizedFileName = normalizeComparable(removeExtension(fileName));
    return Boolean(normalizedTitle) && normalizedTitle === normalizedFileName;
}

function shouldGenerateTitleWithAI(input: {
    fileName: string;
    title: string;
    score: number;
}): boolean {
    if (isGarbageIdLikeName(input.fileName)) return true;
    if (isLikelyDateLikeName(input.fileName)) return true;
    if (isLikelyWeakTitle(input.title)) return true;
    if (input.score < 70 && isOriginalFileNameTitle(input.title, input.fileName)) return true;
    return false;
}

function normalizeSuggestedTitle(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const normalized = value
        .replace(/\s+/g, " ")
        .replace(/\s*[-–—:]+\s*$/, "")
        .trim();
    return normalized.length > 0 ? normalized : null;
}

function isAcceptableSuggestedTitle(value: string | null, previousTitle: string): boolean {
    if (!value) return false;

    if (normalizeComparable(value) === normalizeComparable(previousTitle)) {
        return false;
    }

    if (isLikelyWeakTitle(value)) {
        return false;
    }

    if (isGarbageIdLikeName(value) || isLikelyDateLikeName(value)) {
        return false;
    }

    return value.length >= 4;
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

export function shouldUseAI(
    scored: RuleInference & { score: number; reasons: string[] },
    options?: { shouldGenerateTitle?: boolean },
): boolean {
    if (options?.shouldGenerateTitle) return true;
    if (scored.score <= 70) return true;
    if (!scored.disciplina || isGenericDisciplina(scored.disciplina)) return true;
    return false;
}

export function buildAIPrompt(input: {
    path: string;
    name: string;
    extension: string;
    title: string;
    generateTitle: boolean;
    rule: RuleInference & { score: number; reasons: string[] };
}): string {
    return `A partir deste arquivo, identifique disciplina, tipo e semestre com o máximo de precisão.
Também analise se deve propor um título humano e descritivo para o campo "title".

Caminho: ${input.path}
Nome: ${input.name}
Extensão: ${input.extension}
Título atual: ${input.title}
Disciplina atual: ${input.rule.disciplina ?? "null"}
Tipo atual: ${input.rule.tipo ?? "null"}
Semestre atual: ${input.rule.semester ?? "null"}
Score: ${input.rule.score}
Motivos: ${input.rule.reasons.join("; ")}
Gerar novo título: ${input.generateTitle ? "sim" : "não"}

Regras para o campo "title":
- Se "Gerar novo título" for "sim", ignore IDs numéricos e timestamps no nome original e produza um título humano baseado no caminho e no conteúdo do arquivo.
- Seja conservador: não invente assunto específico sem evidência no conteúdo.
- Se não houver evidência suficiente do assunto, use fallback contextual como "[Disciplina] - [Tipo]".
- Se "Gerar novo título" for "não", preserve o título atual retornando-o sem mudanças.

Retorne JSON puro: {"disciplina": ..., "tipo": ..., "semester": ..., "title": ...}
Use null para disciplina/tipo/semester quando não souber. O campo title deve ser sempre uma string não vazia.
`;
}

export async function callLLM(prompt: string, file: RepoFile): Promise<{ disciplina: string | null; tipo: string | null; semester: string | null; title: string | null }> {
    // Stub local. Substitua por chamada real ao seu LLM preferido.
    // Use ai do Gemini

    try {
        const ai = await getAIClient();
        const absolutePath = isAbsolute(file.path) ? file.path : resolve(process.cwd(), file.path);
        const fileStats = await stat(absolutePath);
        if (fileStats.size > MAX_AI_FILE_BYTES) {
            console.warn(
                `[ai-refine] AI skipped for ${file.path}: file size ${fileStats.size} bytes exceeds configured limit (${MAX_AI_FILE_BYTES} bytes).`,
            );
            return buildLLMFallbackResult();
        }

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

        await waitForActiveFile(ai, uploadedFile);

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
                            title: {
                                type: "string",
                                description: "Um título humano e descritivo, ignorando códigos numéricos de sistema ou timestamps.",
                            },
                        },
                        required: ["disciplina", "tipo", "semester", "title"],
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
                                text: JSON.stringify(file).slice(0, MAX_AI_FILE_METADATA_CHARS) // Enviar os dados do arquivo como parte do prompt para ajudar na inferência
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
        if (isLikelyLLMInputLimitError(error)) {
            console.warn(`[ai-refine] AI skipped for ${file.path}: input exceeds provider limits.`);
            return buildLLMFallbackResult();
        }

        console.error("Erro ao chamar LLM:", error);
        return buildLLMFallbackResult();
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
        llmCaller?: (prompt: string, file: RepoFile) => Promise<{ disciplina: string | null; tipo: string | null; semester: string | null; title: string | null }>;
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
    const shouldGenerateTitle = shouldGenerateTitleWithAI({
        fileName: file.name,
        title: raw.title,
        score: scored.score,
    });

    if (!shouldUseAI(scored, { shouldGenerateTitle })) {
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

    const prompt = buildAIPrompt({
        path: file.path,
        name: file.name,
        extension: file.extension,
        title: raw.title,
        generateTitle: shouldGenerateTitle,
        rule: scored,
    });
    const ai = await (options?.llmCaller ?? callLLM)(prompt, file);

    const finalDisciplina = ai.disciplina ?? scored.disciplina;
    const finalTipo = ai.tipo ?? scored.tipo;
    const finalSemester = ai.semester ?? scored.semester;
    const normalizedSuggestedTitle = normalizeSuggestedTitle(ai.title);
    const shouldApplySuggestedTitle = shouldGenerateTitle && isAcceptableSuggestedTitle(normalizedSuggestedTitle, raw.title);
    const finalTitle = shouldApplySuggestedTitle ? normalizedSuggestedTitle! : raw.title;

    const finalScore = computeFinalScore(finalDisciplina, finalTipo, finalSemester, scored);

    return {
        ...raw,
        title: finalTitle,
        disciplina: finalDisciplina ?? undefined,
        tipo: finalTipo ?? undefined,
        semester: finalSemester ?? undefined,
        scoreMetadata: {
            score: finalScore,
            source: "ai",
            reasons: [
                ...scored.reasons,
                "ai fallback",
                ...(ai.disciplina ? [] : ["ai não sugeriu disciplina"]),
                ...(shouldApplySuggestedTitle ? ["ai sugeriu título"] : []),
            ],
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

function parseLLMResponse(response: any): {
    disciplina: string | null;
    tipo: string | null;
    semester: string | null;
    title: string | null;
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

        const parsed = JSON.parse(raw);

        const safeText = (value: unknown): string | null => {
            if (typeof value !== "string") return null;
            const normalized = value.trim();
            return normalized.length > 0 ? normalized : null;
        };

        return {
            disciplina: safeText(parsed?.disciplina),
            tipo: safeText(parsed?.tipo),
            semester: safeText(parsed?.semester),
            title: safeText(parsed?.title),
        };
    } catch (error) {
        console.error("Erro ao parsear resposta da LLM:", error);
        return {
            disciplina: null,
            tipo: null,
            semester: null,
            title: null,
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

async function waitForActiveFile(ai: any, file: any) {
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
