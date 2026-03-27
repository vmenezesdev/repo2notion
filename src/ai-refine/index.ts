import { inferMetadata } from "../enrich";
import { RecordCandidate, RecordCandidateWithRefinedMetadata, RepoFile, RuleInference } from "../types";

function normalizeComparable(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).trim().toLowerCase();
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

export function computeRuleScore(rule: RuleInference | RecordCandidate): RuleInference & {score:number; reasons:string[]} {
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

export function shouldUseAI(scored: RuleInference & {score:number; reasons:string[]}): boolean {
  if (scored.score <= 80) return true;
  if (!scored.disciplina || isGenericDisciplina(scored.disciplina)) return true;
  return false;
}

export function buildAIPrompt(input: {
  path: string;
  name: string;
  extension: string;
  rule: RuleInference & {score:number; reasons:string[]};
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
`;}

export async function callLLM(prompt: string): Promise<{disciplina:string|null;tipo:string|null;semester:string|null}> {
  // Stub local. Substitua por chamada real ao seu LLM preferido.
  return {
    disciplina: null,
    tipo: null,
    semester: null,
  };
}

export function computeFinalScore(
  disciplina: string | null,
  tipo: string | null,
  semester: string | null,
  base: RuleInference & {score:number; reasons:string[]},
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
    llmCaller?: (prompt: string) => Promise<{disciplina:string|null;tipo:string|null;semester:string|null}>;
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
      score: scored.score,
      source: "rule",
      reasons: scored.reasons,
    };
  }

  const prompt = buildAIPrompt({ path: file.path, name: file.name, extension: file.extension, rule: scored });
  const ai = await (options?.llmCaller ?? callLLM)(prompt);

  const finalDisciplina = ai.disciplina ?? scored.disciplina;
  const finalTipo = ai.tipo ?? scored.tipo;
  const finalSemester = ai.semester ?? scored.semester;

  const finalScore = computeFinalScore(finalDisciplina, finalTipo, finalSemester, scored);

  return {
    ...raw,
    disciplina: finalDisciplina ?? undefined,
    tipo: finalTipo ?? undefined,
    semester: finalSemester ?? undefined,
    score: finalScore,
    source: "ai",
    reasons: [...scored.reasons, "ai fallback", ...(ai.disciplina ? [] : ["ai não sugeriu disciplina"])],
  };
}


