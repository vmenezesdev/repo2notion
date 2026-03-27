import test from "node:test";
import assert from "node:assert/strict";
import { RepoFile } from "../types";
import { computeFinalScore, computeRuleScore, refineMetadata, shouldUseAI } from "./index";

function makeFile(path: string, name: string, extension: string): RepoFile {
  return { kind: "file", path, name, extension };
}

test("computeRuleScore chega a 100 em inferencia forte", () => {
  const rule = {
    title: "ED - AV1 - 2022.1",
    disciplina: "Eletrônica Digital",
    tipo: "Prova",
    semester: "2022.1",
    score: 0,
    reasons: [],
  };

  const scored = computeRuleScore(rule);
  assert.ok(scored.score >= 80);
  assert.ok(scored.reasons.includes("disciplina inferida"));
  assert.ok(scored.reasons.includes("tipo conhecido"));
  assert.ok(scored.reasons.includes("semestre explícito"));
});

test("computeRuleScore aplica penalidades e limita score mínimo em 0", () => {
  const scored = computeRuleScore({
    title: "IMG_2026.jpg",
    disciplina: "Geral",
    tipo: "Material Complementar",
    semester: "2026",
    score: 0,
    reasons: [],
  });

  assert.equal(scored.score, 0);
  assert.ok(scored.reasons.includes("disciplina genérica"));
  assert.ok(scored.reasons.includes("tipo conhecido"));
  assert.ok(scored.reasons.includes("ano explícito"));
  assert.ok(scored.reasons.includes("nome de imagem genérico"));
});

test("computeRuleScore reconhece semestre em formato de grade", () => {
  const scored = computeRuleScore({
    title: "Aula 01",
    disciplina: "Estrutura de Dados",
    tipo: "Material de Aula",
    semester: "Grade S03",
    score: 0,
    reasons: [],
  });

  assert.equal(scored.score, 85);
  assert.ok(scored.reasons.includes("grade de semestre"));
});

test("shouldUseAI retorna true para score baixo e false para score alto", () => {
  const low = computeRuleScore({ title: "IMG_2024.jpg", disciplina: "Geral", tipo: "Material Complementar", semester: null, score: 0, reasons: [] });
  assert.equal(shouldUseAI(low), true);

  const high = computeRuleScore({ title: "CA - Prova 2018.1", disciplina: "Cálculo", tipo: "Prova", semester: "2018.1", score: 0, reasons: [] });
  assert.equal(shouldUseAI(high), false);
});

test("shouldUseAI considera gatilho de geração de título", () => {
  const high = computeRuleScore({ title: "CA - Prova 2018.1", disciplina: "Cálculo", tipo: "Prova", semester: "2018.1", score: 0, reasons: [] });
  assert.equal(shouldUseAI(high, { shouldGenerateTitle: true }), true);
});

test("shouldUseAI aciona IA quando disciplina está ausente mesmo com score alto", () => {
  const highButNoDisciplina = {
    title: "Lista 2",
    disciplina: null,
    tipo: "Lista de exercícios",
    semester: "2023.2",
    score: 95,
    reasons: ["score sintético para validar regra"],
  };

  assert.equal(shouldUseAI(highButNoDisciplina), true);
});

test("computeFinalScore aplica bônus e limita em 100", () => {
  const base = {
    title: "ED - Prova",
    disciplina: "Eletrônica Digital",
    tipo: "Prova",
    semester: "2022.1",
    score: 85,
    reasons: [],
  };

  const final = computeFinalScore("Eletrônica Digital", "prova", "2022.1", base);
  assert.equal(final, 100);
});

test("computeFinalScore preserva score quando IA não agrega sinais fortes", () => {
  const base = {
    title: "Arquivo",
    disciplina: "Geral",
    tipo: "Desconhecido",
    semester: null,
    score: 42,
    reasons: [],
  };

  const final = computeFinalScore("Geral", "Desconhecido", "2022", base);
  assert.equal(final, 42);
});

test("refineMetadata retorna source=rule para arquivo de alta confiança", async () => {
  const file = makeFile("/S01/CA - Calculo I/2020.1 - PH/P1.pdf", "P1.pdf", "pdf");
  const refined = await refineMetadata(file);
  assert.equal(refined.scoreMetadata.source, "rule");
  assert.equal(refined.disciplina, "Calculo I");
  assert.equal(refined.tipo, "Prova");
  assert.equal(refined.semester, "2020.1");
});

test("refineMetadata retorna source=ai para baixa confiança (path genérico)", async () => {
  const file = makeFile("/Outros/arquivo_generico_2026.pdf", "arquivo_generico_2026.pdf", "pdf");
  const refined = await refineMetadata(file, {
    llmCaller: async () => ({
      disciplina: null,
      tipo: null,
      semester: null,
      title: "arquivo_generico_2026",
    }),
  });
  assert.equal(refined.scoreMetadata.source, "ai");
  assert.ok(refined.scoreMetadata.score < 80);
  assert.ok(refined.scoreMetadata.reasons.includes("ai fallback") || refined.scoreMetadata.reasons.includes("ai não sugeriu disciplina"));
});

test("refineMetadata incorpora sugestão da IA quando disponível", async () => {
  const file = makeFile("/S07/GR/Aula 15/15354113_10207630331179536.jpg", "15354113_10207630331179536.jpg", "jpg");
  const aiTitle = "Grafos - Aula 15 - Exemplo de Método Húngaro";
  const refined = await refineMetadata(file, {
    llmCaller: async () => ({
      disciplina: "Sistemas Operacionais",
      tipo: "Resumo",
      semester: "2021.2",
      title: aiTitle,
    }),
  });

  assert.equal(refined.scoreMetadata.source, "ai");
  assert.equal(refined.disciplina, "Sistemas Operacionais");
  assert.equal(refined.tipo, "Resumo");
  assert.equal(refined.semester, "2021.2");
  assert.equal(refined.title, aiTitle);
  assert.ok(refined.scoreMetadata.score > 0);
  assert.ok(refined.scoreMetadata.reasons.includes("ai fallback"));
  assert.ok(!refined.scoreMetadata.reasons.includes("ai não sugeriu disciplina"));
  assert.ok(refined.scoreMetadata.reasons.includes("ai sugeriu título"));
});

test("refineMetadata mantém título quando IA devolve título fraco", async () => {
  const file = makeFile("/S07/GR/Aula 15/15354113_10207630331179536.jpg", "15354113_10207630331179536.jpg", "jpg");
  const refined = await refineMetadata(file, {
    llmCaller: async () => ({
      disciplina: "Sistemas Operacionais",
      tipo: "Resumo",
      semester: "2021.2",
      title: "prova",
    }),
  });

  assert.notEqual(refined.title, "prova");
  assert.ok(!refined.scoreMetadata.reasons.includes("ai sugeriu título"));
});
