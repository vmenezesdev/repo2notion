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

test("ignora pasta relativa em subpastas de documentos", () => {
    const file = makeFile(
        "/Documentos/PUDS/../S01/ED - Eletronica Digital/2018.1 - PH/PUD.doc",
        "PUD.doc",
        "doc",
    );
    assert.equal(inferDisciplina(file), "Eletrônica Digital");
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
    assert.equal(normalizeTitle(pudFile), "Plano de Ensino - Calculo I");

    const provaImagem = makeFile(
        "/S01/CA - Calculo/2018.1 - PH/N2/N2 prova 1.jpeg",
        "N2 prova 1.jpeg",
        "jpeg",
    );
    assert.equal(normalizeTitle(provaImagem), "Prova N2 (Parte 1)");
});

test("limpa titulo tecnico de hardware com extensao encadeada", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/relogio.(0).cnf.cdb", "relogio.(0).cnf.cdb", "cdb");
    assert.equal(normalizeTitle(file), "Relogio (0) cnf");
});

test("corrige mojibake comum brasileiro", () => {
    const file = makeFile("/S02/EA - Eletronica Analogica/2019.2 - MJ/ExercÃ_cio_1.pdf", "ExercÃ_cio_1.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Exercício 1");
});

test("normaliza unicode decomposto na inferencia de disciplina", () => {
    const file = makeFile("/S01/ED - Eletro\u0302nica Digital/2018.1 - PH/PUD Eletro\u0302nica Digital.doc", "PUD Eletro\u0302nica Digital.doc", "doc");
    assert.equal(inferDisciplina(file), "Eletrônica Digital");
});

test("captura professor com sigla curta", () => {
    const tags = inferTags(makeFile("/S01/ED - Eletronica Digital/2014.2 - JB/AP1.pdf", "AP1.pdf", "pdf"));
    assert.ok(tags.includes("JB"));
});

test("captura professor quando pasta vem apos ano semestre", () => {
    const tags = inferTags(makeFile("/S01/CA - Calculo/2014.2/Joao/AP1.pdf", "AP1.pdf", "pdf"));
    assert.ok(tags.includes("JOAO"));
});

test("captura professor composto em pasta ano-semestre", () => {
    const tags = inferTags(makeFile("/S02/ED - Eletronica Digital/2015.2 - Joao Gabriel/N1.pdf", "N1.pdf", "pdf"));
    assert.ok(tags.includes("JOAO GABRIEL"));
});

test("prioriza tipo prova sobre documentacao", () => {
    const tipo = inferTipo(makeFile("/S03/CA - Calculo/2018.1 - PH/Roteiro_Prova_N1.pdf", "Roteiro_Prova_N1.pdf", "pdf"));
    assert.equal(tipo, "Prova");
});

test("prioriza lista explicita mesmo em pasta de avaliacao", () => {
    const tipo = inferTipo(makeFile("/S01/CA - Calculo I/2014.2 - Fernando Macedo/N1/Lista 1 - pag 2.jpg", "Lista 1 - pag 2.jpg", "jpg"));
    assert.equal(tipo, "Lista de Exercícios");
    assert.equal(normalizeTitle(makeFile("/S01/CA - Calculo I/2014.2 - Fernando Macedo/N1/Lista 1 - pag 2.jpg", "Lista 1 - pag 2.jpg", "jpg")), "Lista 1 (Parte 2)");
});

test("nao interpreta P1 como parte do titulo", () => {
    const file = makeFile("/S01/CA - Calculo/2018.1 - PH/Calculo P1.pdf", "Calculo P1.pdf", "pdf");
    assert.equal(normalizeTitle(file), "CA - AV1 - 2018.1");
});

test("preserva lista numerica sem converter em parte", () => {
    const file = makeFile("/S01/CA - Calculo/2018.1 - PH/Lista 1.pdf", "Lista 1.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Lista 1");
});

test("captura rotulos de avaliacao com parcial e nota decimal", () => {
    const parcial = inferTags(makeFile("/S01/ED - Eletronica Digital/2014.2 - JB/AV Parcial 3.pdf", "AV Parcial 3.pdf", "pdf"));
    assert.ok(parcial.includes("AV3"));

    const decimal = inferTags(makeFile("/S01/ED - Eletronica Digital/2014.2 - JB/N1.2.pdf", "N1.2.pdf", "pdf"));
    assert.ok(decimal.includes("N1.2"));
    assert.ok(decimal.includes("N1"));

    const decimalAv = inferTags(makeFile("/S06/SD - Sistemas Distribuidos/2021.1 - PH/AP1.2.pdf", "AP1.2.pdf", "pdf"));
    assert.ok(decimalAv.includes("AV1.2"));
    assert.ok(decimalAv.includes("AV1"));

    const af = inferTags(makeFile("/S01/ED - Eletronica Digital/2014.2 - JB/AF Ultimate.pdf", "AF Ultimate.pdf", "pdf"));
    assert.ok(af.includes("AF"));
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

test("classifica extensoes de quartus como hardware e simulacao", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/projeto_final.sof", "projeto_final.sof", "sof");
    assert.equal(inferTipo(file), "Trabalho/Projeto");
    const tags = inferTags(file);
    assert.ok(tags.includes("Hardware"));
    assert.ok(tags.includes("Simulação"));
    assert.ok(tags.includes("Quartus"));
});

test("mantem compatibilidade de pud como tipo prova", () => {
    const pudFile = makeFile(
        "/Documentos/PUDS/S01/CA - Calculo I/2018.1 - PH/PUD Calculo I.doc",
        "PUD Calculo I.doc",
        "doc",
    );
    assert.equal(inferTipo(pudFile), "Prova");
});

test("adiciona tag projeto para arquivos de proteus", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/projeto_final.pdsprj", "projeto_final.pdsprj", "pdsprj");
    const tags = inferTags(file);
    assert.ok(tags.includes("Projeto"));
    assert.ok(tags.includes("Hardware"));
});

test("prioriza tipo prova para proteus em contexto de avaliacao", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/N1/MI.dsn", "MI.dsn", "dsn");
    assert.equal(inferTipo(file), "Prova");
});

test("aceita disciplina em pasta especial sem sigla", () => {
    const file = makeFile("/Cadeiras com o Ronaldo/Lasca Ronaldo.gif", "Lasca Ronaldo.gif", "gif");
    assert.equal(inferDisciplina(file), "Cadeiras com o Ronaldo");
    const tags = inferTags(file);
    assert.ok(tags.includes("CADEIRASCOMORONALDO"));
});

test("interpreta pasta com sigla sem espacos no hifen", () => {
    const file = makeFile("/BEPID-Apple/Projeto 1.docx", "Projeto 1.docx", "docx");
    assert.equal(inferDisciplina(file), "BEPID Apple");
});

test("nao filtra codigo em disciplinas tecnicas", () => {
    const technicalCode = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/main.c", "main.c", "c");
    const metadata = inferMetadata(technicalCode, { filterCodeFiles: true });
    assert.notEqual(metadata, null);

    const ipCode = makeFile("/S01/IP - Introducao a Programacao/2022.1 - PH/main.c", "main.c", "c");
    assert.notEqual(inferMetadata(ipCode, { filterCodeFiles: true }), null);

    const edaCode = makeFile("/S03/EDA - Estrutura de Dados/2022.1 - PH/arvore.c", "arvore.c", "c");
    assert.notEqual(inferMetadata(edaCode, { filterCodeFiles: true }), null);
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
