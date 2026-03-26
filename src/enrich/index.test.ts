import test from "node:test";
import assert from "node:assert/strict";
import {
    inferDisciplina,
    inferMetadata,
    inferSemester,
    inferTags,
    inferTipo,
    normalizeTitle,
} from "./index";
import { RepoFile } from "../types";

function makeFile(path: string, name: string, extension: string): RepoFile {
    return {
        kind: "file",
        path,
        name,
        extension,
    };
}

test("expande dicionario de siglas", () => {
    assert.equal(inferDisciplina(makeFile("/S03/EDO - Equacoes Diferenciais/2018.1 - PH/AP1.pdf", "AP1.pdf", "pdf")), "Equações Diferenciais");
    assert.equal(inferDisciplina(makeFile("/S02/EA - Eletronica Analogica/2019.2 - MJ/Lista1.pdf", "Lista1.pdf", "pdf")), "Eletrônica Analógica");
    assert.equal(inferDisciplina(makeFile("/S06/RCC - Redes/2020.1 - JB/Prova.pdf", "Prova.pdf", "pdf")), "Redes de Computadores");
    assert.equal(inferDisciplina(makeFile("/S06/SE - Sistemas Embarcados/2020.1 - JB/Prova.pdf", "Prova.pdf", "pdf")), "Sistemas Embarcados");
});

test("ignora pastas genericas na inferencia de disciplina", () => {
    const file = makeFile(
        "/Documentos/PUDS/S01/CA - Calculo I/2018.1 - PH/PUD Calculo I.doc",
        "PUD Calculo I.doc",
        "doc",
    );
    assert.equal(inferDisciplina(file), "Cálculo");
});

test("normaliza titulo progressivamente para avaliacoes", () => {
    const apFile = makeFile("/S01/ED - Eletronica Digital/2014.2 - JB/AP1.pdf", "AP1.pdf", "pdf");
    assert.equal(normalizeTitle(apFile), "ED - AV1 - 2014.2");

    const provaComContexto = makeFile("/S01/CA - Calculo/2016.1 - PH/Prova_Calculo_1.pdf", "Prova_Calculo_1.pdf", "pdf");
    assert.equal(normalizeTitle(provaComContexto), "Calculo 1");
});

test("normaliza titulo de plano de ensino e prova em imagem", () => {
    const pudFile = makeFile(
        "/Documentos/PUDS/S01/CA - Calculo I/2018.1 - PH/PUD Calculo I.doc",
        "PUD Calculo I.doc",
        "doc",
    );
    assert.equal(normalizeTitle(pudFile), "Plano de Ensino - Cálculo");

    const provaImagem = makeFile(
        "/S01/CA - Calculo/2018.1 - PH/N2/N2 prova 1.jpeg",
        "N2 prova 1.jpeg",
        "jpeg",
    );
    assert.equal(normalizeTitle(provaImagem), "Prova N2 (Parte 1)");
});

test("corrige mojibake comum brasileiro", () => {
    const file = makeFile("/S02/EA - Eletronica Analogica/2019.2 - MJ/ExercÃ_cio_1.pdf", "ExercÃ_cio_1.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Exercício 1");
});

test("captura professor com sigla curta", () => {
    const tags = inferTags(makeFile("/S01/ED - Eletronica Digital/2014.2 - JB/AP1.pdf", "AP1.pdf", "pdf"));
    assert.ok(tags.includes("JB"));
});

test("captura professor quando pasta vem apos ano semestre", () => {
    const tags = inferTags(makeFile("/S01/CA - Calculo/2014.2/Joao/AP1.pdf", "AP1.pdf", "pdf"));
    assert.ok(tags.includes("Joao"));
});

test("prioriza tipo prova sobre documentacao", () => {
    const tipo = inferTipo(makeFile("/S03/CA - Calculo/2018.1 - PH/Roteiro_Prova_N1.pdf", "Roteiro_Prova_N1.pdf", "pdf"));
    assert.equal(tipo, "Prova");
});

test("classifica binarios de firmware como hardware/projeto", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/projeto_final.hex", "projeto_final.hex", "hex");
    assert.equal(inferTipo(file), "Trabalho/Projeto");
    const tags = inferTags(file);
    assert.ok(tags.includes("Hardware"));
});

test("classifica pdsbak como hardware e proteus", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/projeto_final.pdsbak", "projeto_final.pdsbak", "pdsbak");
    assert.equal(inferTipo(file), "Trabalho/Projeto");
    const tags = inferTags(file);
    assert.ok(tags.includes("Hardware"));
    assert.ok(tags.includes("Proteus"));
});

test("nao filtra codigo em disciplinas tecnicas", () => {
    const technicalCode = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/main.c", "main.c", "c");
    const metadata = inferMetadata(technicalCode, { filterCodeFiles: true });
    assert.notEqual(metadata, null);
});

test("mantem filtro de codigo em contexto nao tecnico", () => {
    const genericCode = makeFile("/S04/PT - Producao Textual/2022.2 - PH/script.c", "script.c", "c");
    const metadata = inferMetadata(genericCode, { filterCodeFiles: true });
    assert.equal(metadata, null);
});

test("aceita fallback de semestre somente com ano", () => {
    const onlyYear = makeFile("/S01/CA - Calculo/2013/Lista1.pdf", "Lista1.pdf", "pdf");
    assert.equal(inferSemester(onlyYear), "2013");
});

test("inferencia de semestre nao perde estado entre chamadas", () => {
    const file = makeFile("/S01/CA - Calculo/2019.1/AP1.pdf", "AP1.pdf", "pdf");
    assert.equal(inferSemester(file), "2019.1");
    assert.equal(inferSemester(file), "2019.1");
});
