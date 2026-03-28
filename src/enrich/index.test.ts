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
import { RepoFile, RepoNodeKind } from "../types";

function makeFile(path: string, name: string, extension: string): RepoFile {
    return {
        kind: RepoNodeKind.FILE,
        path,
        name,
        extension,
        children: [],
    };
}

test("expande dicionario de siglas", () => {
    assert.equal(inferDisciplina(makeFile("/S03/IAA - Introducao a Analise de Algoritmos/2018.1 - PH/Lista1.pdf", "Lista1.pdf", "pdf")), "Introdução à Análise de Algoritmos");
    assert.equal(inferDisciplina(makeFile("/S02/IN - Instrumentacao/2019.2 - MJ/Lista1.pdf", "Lista1.pdf", "pdf")), "Instrumentação");
    assert.equal(inferDisciplina(makeFile("/S01/EF - Etica e Filosofia/2018.2 - PH/Resumo.pdf", "Resumo.pdf", "pdf")), "Ética e Filosofia");
    assert.equal(inferDisciplina(makeFile("/S03/EDO - Equacoes Diferenciais/2018.1 - PH/AP1.pdf", "AP1.pdf", "pdf")), "Equações Diferenciais");
    assert.equal(inferDisciplina(makeFile("/S02/EA - Eletronica Analogica/2019.2 - MJ/Lista1.pdf", "Lista1.pdf", "pdf")), "Eletrônica Analógica");
    assert.equal(inferDisciplina(makeFile("/S06/SEMBS - Sistemas Embarcados/2020.1 - JB/Prova.pdf", "Prova.pdf", "pdf")), "Sistemas Embarcados");
    assert.equal(inferDisciplina(makeFile("/S06/RCC - Redes/2020.1 - JB/Prova.pdf", "Prova.pdf", "pdf")), "Redes de Computadores");
    assert.equal(inferDisciplina(makeFile("/S06/SE - Sistemas Embarcados/2020.1 - JB/Prova.pdf", "Prova.pdf", "pdf")), "Sistemas Embarcados");
    assert.equal(inferDisciplina(makeFile("/S03/AC - Arquitetura de Computadores/2018.1 - PH/AP1.pdf", "AP1.pdf", "pdf")), "Arquitetura de Computadores");
    assert.equal(inferDisciplina(makeFile("/S02/CN - Calculo Numerico/2019.2 - MJ/Lista1.pdf", "Lista1.pdf", "pdf")), "Cálculo Numérico");
    assert.equal(inferDisciplina(makeFile("/S02/GR - Grafos/2019.2 - MJ/Lista1.pdf", "Lista1.pdf", "pdf")), "Grafos");
    assert.equal(inferDisciplina(makeFile("/S04/PDS - Processamento Digital de Sinais/2020.2 - PH/AP1.pdf", "AP1.pdf", "pdf")), "Processamento Digital de Sinais");
    assert.equal(inferDisciplina(makeFile("/S02/MD - Matematica Discreta/2019.2 - MJ/Lista1.pdf", "Lista1.pdf", "pdf")), "Matemática Discreta");
    assert.equal(inferDisciplina(makeFile("/S05/EI - Eletronica Industrial/2021.1 - JB/Prova.pdf", "Prova.pdf", "pdf")), "Eletrônica Industrial");
    assert.equal(inferDisciplina(makeFile("/S01/MCT - Metodologia Cientifica/2022.1 - PH/Trabalho.docx", "Trabalho.docx", "docx")), "Metodologia Científica e Tecnológica");
    assert.equal(inferDisciplina(makeFile("/S08/VC - Visao Computacional/2023.1 - PH/Lista1.pdf", "Lista1.pdf", "pdf")), "Visão Computacional");
    assert.equal(inferDisciplina(makeFile("/S07/IHC - Interacao Humano Computador/2023.2 - PH/Trabalho.pdf", "Trabalho.pdf", "pdf")), "Interação Humano Computador");
    assert.equal(inferDisciplina(makeFile("/S08/PDI - Processamento Digital de Imagens/2023.2 - PH/Lista1.pdf", "Lista1.pdf", "pdf")), "Processamento Digital de Imagens");
    assert.equal(inferDisciplina(makeFile("/S10/TGI - Trabalho de Graduacao Interdisciplinar/2024.1 - PH/TGI.pdf", "TGI.pdf", "pdf")), "Trabalho de Graduação Interdisciplinar");
    assert.equal(inferDisciplina(makeFile("/S02/PS - Projeto Social/2024.1 - PH/Relatorio.pdf", "Relatorio.pdf", "pdf")), "Projeto Social");
    assert.equal(inferDisciplina(makeFile("/S06/PO - Pesquisa e Ordenacao/2023.2 - PH/Lista1.pdf", "Lista1.pdf", "pdf")), "Pesquisa e Ordenação");
    assert.equal(inferDisciplina(makeFile("/S06/PEO - Pesquisa e Ordenacao/2023.2 - PH/Lista1.pdf", "Lista1.pdf", "pdf")), "Pesquisa e Ordenação");
    assert.equal(inferDisciplina(makeFile("/S08/IC - Inteligencia Computacional/2024.1 - PH/Projeto.pdf", "Projeto.pdf", "pdf")), "Inteligência Computacional");
    assert.equal(inferDisciplina(makeFile("/S05/IAI - Introducao a Automacao Industrial/2023.1 - PH/Relatorio.pdf", "Relatorio.pdf", "pdf")), "Introdução à Automação Industrial e Controle");
    assert.equal(inferDisciplina(makeFile("/S09/EG - Empreendedorismo e Gestao/2024.2 - PH/Projeto.pdf", "Projeto.pdf", "pdf")), "Empreendedorismo e Gestão");
});

test("ignora pastas genericas na inferencia de disciplina", () => {
    const file = makeFile(
        "/Documentos/PUDS/S01/CA - Calculo I/2018.1 - PH/PUD Calculo I.doc",
        "PUD Calculo I.doc",
        "doc",
    );
    assert.equal(inferDisciplina(file), "Calculo I");
});

test("extrai disciplina do nome do arquivo em pastas PUDS genericas", () => {
    const file = makeFile(
        "/Documentos/PUDS/S01/PUD Calculo I.doc",
        "PUD Calculo I.doc",
        "doc",
    );
    assert.equal(inferDisciplina(file), "Calculo I");
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
    assert.equal(normalizeTitle(pudFile), "CA - Plano de Ensino");

    const provaImagem = makeFile(
        "/S01/CA - Calculo/2018.1 - PH/N2/N2 prova 1.jpeg",
        "N2 prova 1.jpeg",
        "jpeg",
    );
    assert.equal(normalizeTitle(provaImagem), "Prova N2 (Parte 01)");
});

test("nao captura subpastas tecnicas como disciplina", () => {
    const designPatterns = makeFile(
        "/S05/PP - Padroes de Projeto/Python/abstract_factory/main.py",
        "main.py",
        "py",
    );
    assert.equal(inferDisciplina(designPatterns), "Padrões de Projeto");

    const architecture = makeFile(
        "/S03/AC - Arquitetura de Computadores/Arm9/DDI0201D.pdf",
        "DDI0201D.pdf",
        "pdf",
    );
    assert.equal(inferDisciplina(architecture), "Arquitetura de Computadores");

    const electronics = makeFile(
        "/S01/ED - Eletronica Digital/4. Relogio/quartus/relogio.bdf",
        "relogio.bdf",
        "bdf",
    );
    assert.equal(inferDisciplina(electronics), "Eletrônica Digital");
});

test("remove ordinal pendurado ao limpar prefixo numerico", () => {
    const file = makeFile(
        "/S01/CA - Calculo I/2018.1 - PH/553670-1ª_-_Definicao_de_derivadas_e_retas_tangentes.pdf",
        "553670-1ª_-_Definicao_de_derivadas_e_retas_tangentes.pdf",
        "pdf",
    );
    assert.equal(normalizeTitle(file), "Definicao de derivadas e retas tangentes");
});

test("nao interpreta timestamp como parte", () => {
    const file = makeFile(
        "/provas/S01/CA - Calculo/2017.1 - PH/P_20170530_141545.jpg",
        "P_20170530_141545.jpg",
        "jpg",
    );
    assert.equal(normalizeTitle(file), "Calculo I - Prova (2017.1)");
});

test("nao interpreta sufixo de timestamp em nome de camera como parte", () => {
    const file = makeFile(
        "/provas/S01/CA - Calculo I/2026.1 - PH/photo_2026-03-25_14-10-04.jpg",
        "photo_2026-03-25_14-10-04.jpg",
        "jpg",
    );
    assert.equal(normalizeTitle(file), "Prova - Calculo I - 2026.1 (Imagem)");
});

test("preserva nome descritivo em imagem de prova", () => {
    const file = makeFile(
        "/provas/S01/CA - Calculo/2018.1 - PH/Lasca Ronaldo.gif",
        "Lasca Ronaldo.gif",
        "gif",
    );
    assert.equal(normalizeTitle(file), "Lasca Ronaldo");
});

test("limpa titulo tecnico de hardware com extensao encadeada", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/relogio.(0).cnf.cdb", "relogio.(0).cnf.cdb", "cdb");
    assert.equal(normalizeTitle(file), "Relogio (0) cnf");
});

test("corrige mojibake comum brasileiro", () => {
    const file = makeFile("/S02/EA - Eletronica Analogica/2019.2 - MJ/ExercÃ_cio_1.pdf", "ExercÃ_cio_1.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Exercício 1");

    const pluralFile = makeFile("/S02/EA - Eletronica Analogica/2019.2 - MJ/ExercÃ_cios_2.pdf", "ExercÃ_cios_2.pdf", "pdf");
    assert.equal(normalizeTitle(pluralFile), "Exercícios 2");

    const fixaFile = makeFile(
        "/S02/EA - Eletronica Analogica/2019.2 - MJ/1917674-1_-_ExercÃ_cio_de_FixaÃ§Ã£o.pdf",
        "1917674-1_-_ExercÃ_cio_de_FixaÃ§Ã£o.pdf",
        "pdf",
    );
    assert.equal(normalizeTitle(fixaFile), "Exercício de Fixação");
});

test("contextualiza titulos genericos com sigla e semestre", () => {
    const prova = makeFile("/S05/SO - Sistemas Operacionais/2015.2 - Dijalma/Prova.pdf", "Prova.pdf", "pdf");
    assert.equal(normalizeTitle(prova), "Sistemas Operacionais - Prova - 2015.2");

    const main = makeFile("/S04/CA - Calculo I/2018.1 - PH/main.c", "main.c", "c");
    assert.equal(normalizeTitle(main), "CA - Main - 2018.1");
});

test("normaliza unicode decomposto na inferencia de disciplina", () => {
    const file = makeFile("/S01/ED - Eletro\u0302nica Digital/2018.1 - PH/PUD Eletro\u0302nica Digital.doc", "PUD Eletro\u0302nica Digital.doc", "doc");
    assert.equal(inferDisciplina(file), "Eletrônica Digital");
});

test("captura professor com sigla curta", () => {
    const tags = inferTags(makeFile("/S01/ED - Eletronica Digital/2014.2 - JB/AP1.pdf", "AP1.pdf", "pdf"));
    assert.ok(tags.includes("João Batista Bezerra Frota"));
});

test("captura professor quando pasta vem apos ano semestre", () => {
    const tags = inferTags(makeFile("/S01/CA - Calculo/2014.2/Joao/AP1.pdf", "AP1.pdf", "pdf"));
    assert.ok(tags.includes("JOAO"));
});

test("captura professor composto em pasta ano-semestre", () => {
    const tags = inferTags(makeFile("/S02/ED - Eletronica Digital/2015.2 - Joao Gabriel/N1.pdf", "N1.pdf", "pdf"));
    assert.ok(tags.includes("JOAO GABRIEL"));
});

test("nao mistura ricardo rodriges com ricardo taveira", () => {
    const tagsRodriges = inferTags(makeFile("/S04/SD - Sistemas Distribuidos/2020.2 - Ricardo Rodriges/AP1.pdf", "AP1.pdf", "pdf"));
    assert.ok(tagsRodriges.includes("Ricardo Rodrigues"));
    assert.ok(!tagsRodriges.includes("Ricardo Duarte Taveira"));

    const tagsTaveira = inferTags(makeFile("/S04/SD - Sistemas Distribuidos/2020.2 - Ricardo Taveira/AP1.pdf", "AP1.pdf", "pdf"));
    assert.ok(tagsTaveira.includes("Ricardo Duarte Taveira"));
});

test("desambigua ED por professor no caminho", () => {
    const edDigital = makeFile("/S03/ED/2022.1 - JB/AP1.pdf", "AP1.pdf", "pdf");
    const edEstrutura = makeFile("/S01/ED/2022.1 - Alisson/AP1.pdf", "AP1.pdf", "pdf");
    const edErnani = makeFile("/S01/ED/2022.1 - Ernani Leite/AP1.pdf", "AP1.pdf", "pdf");
    assert.equal(inferDisciplina(edDigital), "Estrutura de Dados");
    assert.equal(inferDisciplina(edEstrutura), "Eletrônica Digital");
    assert.equal(inferDisciplina(edErnani), "Eletrônica Digital");
});

test("prioriza tipo prova sobre documentacao", () => {
    const tipo = inferTipo(makeFile("/S03/CA - Calculo/2018.1 - PH/Roteiro_Prova_N1.pdf", "Roteiro_Prova_N1.pdf", "pdf"));
    assert.equal(tipo, "Prova");
});

test("prioriza lista explicita mesmo em pasta de avaliacao", () => {
    const tipo = inferTipo(makeFile("/S01/CA - Calculo I/2014.2 - Fernando Macedo/N1/Lista 1 - pag 2.jpg", "Lista 1 - pag 2.jpg", "jpg"));
    assert.equal(tipo, "Lista de Exercícios");
    assert.equal(normalizeTitle(makeFile("/S01/CA - Calculo I/2014.2 - Fernando Macedo/N1/Lista 1 - pag 2.jpg", "Lista 1 - pag 2.jpg", "jpg")), "Lista 1 (Parte 02)");
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

test("nao marca AF apenas por palavra final fora de contexto de prova", () => {
    const tags = inferTags(makeFile("/S01/IP - Introducao a Programacao/2014.2 - JB/cfinal.html", "cfinal.html", "html"));
    assert.ok(!tags.includes("AF"));
});

test("reconhece segunda chamada no titulo e nas tags", () => {
    const file = makeFile(
        "/S01/IP - Introducao a Programacao/2024.2 - PH/AV1_2chamada.pdf",
        "AV1_2chamada.pdf",
        "pdf",
    );
    assert.equal(normalizeTitle(file), "IP - AV1 (2ª Chamada) - 2024.2");
    const tags = inferTags(file);
    assert.ok(tags.includes("2ª Chamada"));
});

test("classifica binarios de firmware como projeto sem hardware", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/projeto_final.hex", "projeto_final.hex", "hex");
    assert.equal(inferTipo(file), "Trabalho/Projeto");
    const tags = inferTags(file);
    assert.ok(!tags.includes("Hardware"));
});

test("classifica pdsbak como hardware e proteus", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/projeto_final.pdsbak", "projeto_final.pdsbak", "pdsbak");
    assert.equal(inferTipo(file), "Trabalho/Projeto");
    const tags = inferTags(file);
    assert.ok(!tags.includes("Hardware"));
    assert.ok(tags.includes("Proteus"));
    assert.ok(tags.includes("Simulação"));
});

test("classifica fig como simulacao", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/lab_01.fig", "lab_01.fig", "fig");
    const tags = inferTags(file);
    assert.ok(tags.includes("Simulação"));
    assert.ok(tags.includes("MATLAB"));
});

test("marca arquivo m como matlab e script", () => {
    const file = makeFile("/S05/CN - Calculo Numerico/2022.1 - PH/metodo_newton.m", "metodo_newton.m", "m");
    const tags = inferTags(file);
    assert.ok(tags.includes("MATLAB"));
    assert.ok(tags.includes("Script"));
});

test("classifica extensoes de quartus como hardware e simulacao", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/projeto_final.sof", "projeto_final.sof", "sof");
    assert.equal(inferTipo(file), "Trabalho/Projeto");
    const tags = inferTags(file);
    assert.ok(!tags.includes("Hardware"));
    assert.ok(tags.includes("Simulação"));
    assert.ok(tags.includes("Quartus"));
});

test("classifica pud como plano de ensino", () => {
    const pudFile = makeFile(
        "/Documentos/PUDS/S01/CA - Calculo I/2018.1 - PH/PUD Calculo I.doc",
        "PUD Calculo I.doc",
        "doc",
    );
    assert.equal(inferTipo(pudFile), "Plano de Ensino");
});

test("normaliza path com barras duplas em inferMetadata", () => {
    const file = makeFile(
        "../provas//S01/CA - Calculo/2018.1 - PH/AP1.pdf",
        "AP1.pdf",
        "pdf",
    );
    const metadata = inferMetadata(file);
    assert.notEqual(metadata, null);
    assert.equal(metadata?.sourcePath, "../provas/S01/CA - Calculo/2018.1 - PH/AP1.pdf");
});

test("sequencia de imagem curta usa contexto da disciplina", () => {
    const file = makeFile("/S01/ED - Eletronica Digital/2019.1 - JB/VS01_01.jpg", "VS01_01.jpg", "jpg");
    assert.equal(normalizeTitle(file), "Prova - Eletrônica Digital (Parte 01)");
    const tags = inferTags(file);
    assert.ok(tags.includes("VS1"));
});

test("reconhece VS como prova", () => {
    const file = makeFile("/S01/CA - Calculo/2019.1 - PH/VS.pdf", "VS.pdf", "pdf");
    assert.equal(inferTipo(file), "Prova");
    const tags = inferTags(file);
    assert.ok(tags.includes("VS"));
});

test("nao filtra codigo tecnico em AC, CG, CN e GAA", () => {
    const acCode = makeFile("/S03/AC - Arquitetura de Computadores/2022.1 - PH/main.c", "main.c", "c");
    const cgCode = makeFile("/S07/CG - Computacao Grafica/2022.1 - PH/cubo.m", "cubo.m", "m");
    const cnCode = makeFile("/S05/CN - Calculo Numerico/2022.1 - PH/ep1.c", "ep1.c", "c");
    const gaaCode = makeFile("/S04/GAA - Geometria Analitica e Algebra Linear/2022.1 - Valberto/gaal.py", "gaal.py", "py");

    assert.notEqual(inferMetadata(acCode, { filterCodeFiles: true }), null);
    assert.notEqual(inferMetadata(cgCode, { filterCodeFiles: true }), null);
    assert.notEqual(inferMetadata(cnCode, { filterCodeFiles: true }), null);
    assert.notEqual(inferMetadata(gaaCode, { filterCodeFiles: true }), null);
});

test("deduplica semestre no titulo quando ja inferido", () => {
    const file = makeFile("/S05/CN - Calculo Numerico/2020.1 - Joao Gabriel/calcnum 2020.1 avaliacao1.pdf", "calcnum 2020.1 avaliacao1.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Calcnum avaliacao1");
});

test("normaliza novos professores no caminho", () => {
    const tagsValberto = inferTags(makeFile("/S04/GAA - Geometria Analitica e Algebra Linear/2022.1 - Valberto/Lista1.pdf", "Lista1.pdf", "pdf"));
    const tagsAndreia = inferTags(makeFile("/S07/GP - Gerenciamento de Projetos/2022.2 - Andreia Rodrigues/Trabalho.pdf", "Trabalho.pdf", "pdf"));
    const tagsPauloDiego = inferTags(makeFile("/S06/SEMBS - Sistemas Embarcados/2022.2 - Paulo Diego/Projeto.pdsprj", "Projeto.pdsprj", "pdsprj"));

    assert.ok(tagsValberto.includes("Valberto"));
    assert.ok(tagsAndreia.includes("Andréia Rodrigues"));
    assert.ok(tagsPauloDiego.includes("Paulo Diego"));
});

test("adiciona tag projeto para arquivos de proteus", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/projeto_final.pdsprj", "projeto_final.pdsprj", "pdsprj");
    const tags = inferTags(file);
    assert.ok(tags.includes("Projeto"));
    assert.ok(!tags.includes("Hardware"));
});

test("nao trata pasta de avaliacao como provas para proteus", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/N1/MI.dsn", "MI.dsn", "dsn");
    assert.equal(inferTipo(file), "Trabalho/Projeto");
});

test("aceita disciplina em pasta especial sem sigla", () => {
    const file = makeFile("/Cadeiras com o Ronaldo/Lasca Ronaldo.gif", "Lasca Ronaldo.gif", "gif");
    assert.equal(inferDisciplina(file), "Outros - Prof. Ronaldo Fernandes Ramos");
    const tags = inferTags(file);
    assert.ok(tags.includes("Ronaldo Fernandes Ramos"));
});

test("classifica listagem, resolvidos e pratica", () => {
    const listagem = makeFile("/S01/CA - Calculo/2018.1 - Fernando Macedo/2a_listagem.pdf", "2a_listagem.pdf", "pdf");
    const resolvidos = makeFile("/S01/CA - Calculo/2018.1 - Fernando Macedo/Exercicios resolvidos.pdf", "Exercicios resolvidos.pdf", "pdf");
    const pratica = makeFile("/S05/SO - Sistemas Operacionais/2019.1 - Roberto Carlos/Pratica 1.pdf", "Pratica 1.pdf", "pdf");

    assert.equal(inferTipo(listagem), "Lista de Exercícios");
    assert.equal(inferTipo(resolvidos), "Gabarito/Resolução");
    assert.equal(inferTipo(pratica), "Trabalho/Projeto");
});

test("normaliza professor canonico novo", () => {
    const tags = inferTags(makeFile("/S01/CA - Calculo/2018.1 - Fernando Macedo/AP1.pdf", "AP1.pdf", "pdf"));
    assert.ok(tags.includes("Fernando Macedo"));
});

test("captura novos professores por padrao ano-semestre", () => {
    const tags = inferTags(makeFile("/S05/SO - Sistemas Operacionais/2015.2 - Carlos Wagner/Prova.pdf", "Prova.pdf", "pdf"));
    assert.ok(tags.includes("Carlos Wagner"));
});

test("remove prefixo numerico de ordenacao no titulo", () => {
    const file = makeFile("/S01/ED - Eletronica Digital/2018.1 - PH/1 - PRATICA_DE_ELETRONICA_DIGITAL_II.pdf", "1 - PRATICA_DE_ELETRONICA_DIGITAL_II.pdf", "pdf");
    assert.equal(normalizeTitle(file), "PRATICA DE ELETRONICA DIGITAL II");
});

test("nao usa pasta raiz provas para classificar tudo como prova", () => {
    const file = makeFile("../provas//Tabelas/README.md", "README.md", "md");
    assert.equal(inferTipo(file), "Documentação");
});

test("prioriza administrativo estagio sobre contexto de provas", () => {
    const file = makeFile("../provas//Documentos/IFCE - ESTAGIO NAO OBRIGATORIO.pdf", "IFCE - ESTAGIO NAO OBRIGATORIO.pdf", "pdf");
    assert.equal(inferTipo(file), "Administrativo/Estágio");
});

test("diferencia gabarito e resolucao", () => {
    const gabarito = makeFile("/S01/CA - Calculo/2018.1 - PH/Gabarito AP1.pdf", "Gabarito AP1.pdf", "pdf");
    const resolucao = makeFile("/S01/CA - Calculo/2018.1 - PH/Resolucao Lista 1.pdf", "Resolucao Lista 1.pdf", "pdf");
    assert.equal(inferTipo(gabarito), "Gabarito/Resolução");
    assert.equal(inferTipo(resolucao), "Gabarito/Resolução");
});

test("reconhece termos em ingles para prova e lista", () => {
    const exam = makeFile("/S01/CA - Calculo/2018.1 - PH/Exam 1.pdf", "Exam 1.pdf", "pdf");
    const assignment = makeFile("/S01/CA - Calculo/2018.1 - PH/Assignment 1.pdf", "Assignment 1.pdf", "pdf");
    assert.equal(inferTipo(exam), "Prova");
    assert.equal(inferTipo(assignment), "Lista de Exercícios");
});

test("interpreta pasta com sigla sem espacos no hifen", () => {
    const file = makeFile("/BEPID-Apple/Projeto 1.docx", "Projeto 1.docx", "docx");
    assert.equal(inferDisciplina(file), "BEPID Apple");
});

test("interpreta pasta com sigla e nome sem espacos no hifen", () => {
    const file = makeFile("/S01/CA-Calculo I/2024.1 - PH/Lista 1.pdf", "Lista 1.pdf", "pdf");
    assert.equal(inferDisciplina(file), "Calculo I");
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

test("nao exige lista manual para contexto tecnico conhecido", () => {
    const soCode = makeFile("/S05/SO - Sistemas Operacionais/2022.2 - PH/escalonador.c", "escalonador.c", "c");
    assert.notEqual(inferMetadata(soCode, { filterCodeFiles: true }), null);
});

test("ativa filtro de codigo por padrao fora de contexto tecnico", () => {
    const genericCode = makeFile("/S04/PT - Producao Textual/2022.2 - PH/script.c", "script.c", "c");
    assert.equal(inferMetadata(genericCode), null);

    const technicalCode = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/main.c", "main.c", "c");
    assert.notEqual(inferMetadata(technicalCode), null);
});

test("filtra artefatos compilados de quartus e proteus", () => {
    const cdbFile = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/relogio.cdb", "relogio.cdb", "cdb");
    const qmsgFile = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/relogio.qmsg", "relogio.qmsg", "qmsg");
    assert.equal(inferMetadata(cdbFile), null);
    assert.equal(inferMetadata(qmsgFile), null);
});

test("nao usa pasta de professor como disciplina", () => {
    const file = makeFile("/S05/2015.2 - Dijalma/SO - Sistemas Operacionais/N1.pdf", "N1.pdf", "pdf");
    assert.equal(inferDisciplina(file), "Sistemas Operacionais");
});

test("ignora subpastas tecnicas genericas ao inferir disciplina", () => {
    const file = makeFile("/S03/EDA - Estrutura de Dados/2022.1 - Ernani Leite/Trabalho1/src/main.c", "main.c", "c");
    assert.equal(inferDisciplina(file), "Estrutura de Dados");
    const metadata = inferMetadata(file, { filterCodeFiles: true });
    assert.notEqual(metadata, null);
    assert.equal(metadata?.disciplina, "Estrutura de Dados");
});

test("ignora pasta de topico e sobe para disciplina real", () => {
    const file = makeFile(
        "/S09/PPD - Programacao Paralela e Distribuida/2023.2 - PH/Trabalho 1 - Sockets/Projeto1.pdf",
        "Projeto1.pdf",
        "pdf",
    );
    assert.equal(inferDisciplina(file), "Programação Paralela e Distribuída");
});

test("descarta lixo de pastas db e output_files", () => {
    const dbFile = makeFile("/S01/ED - Eletronica Digital/2022.1 - JB/relogio/db/relogio.cdb", "relogio.cdb", "cdb");
    const outputFile = makeFile("/S01/ED - Eletronica Digital/2022.1 - JB/relogio/output_files/relogio.sof", "relogio.sof", "sof");
    assert.equal(inferMetadata(dbFile), null);
    assert.equal(inferMetadata(outputFile), null);
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

test("prioriza semestre no nome do arquivo sobre pasta", () => {
    const file = makeFile("/S01/CA - Calculo/2017.1 - PH/Prova_2018_2.pdf", "Prova_2018_2.pdf", "pdf");
    assert.equal(inferSemester(file), "2017.1");
});

test("prioriza semestre academico da pasta sobre ano solto no arquivo", () => {
    const file = makeFile("/S01/CA - Calculo/2024.1 - PH/IMG_2023.jpg", "IMG_2023.jpg", "jpg");
    assert.equal(inferSemester(file), "2024.1");
});

test("desambigua ED por palavra-chave no caminho", () => {
    const edDigital = makeFile("../provas//S01/ED - Eletronica Digital/2024.2 - Carlos Wagner/ED_AV2.pdf", "ED_AV2.pdf", "pdf");
    assert.equal(inferDisciplina(edDigital), "Eletrônica Digital");

    const edEstrutura = makeFile("/S03/ED - Estrutura de Dados/2024.1 - Wagner/ED_AV2.pdf", "ED_AV2.pdf", "pdf");
    assert.equal(inferDisciplina(edEstrutura), "Estrutura de Dados");
});

test("ignora pasta informal de professor ao inferir disciplina", () => {
    const file = makeFile("/S03/EDA - Estrutura de Dados/Cadeiras com o Ronaldo/aula1.pdf", "aula1.pdf", "pdf");
    assert.equal(inferDisciplina(file), "Estrutura de Dados");
});

test("nao segmenta disciplina erroneamente em topico com hifen 7SEG", () => {
    const file = makeFile(
        "/S03/ED - Eletronica Digital/2014.2 - Fernando Macedo/1. Decodificador BCD-7SEG/1.1 Decodificador BCD-7SEG.pdf",
        "1.1 Decodificador BCD-7SEG.pdf",
        "pdf",
    );
    assert.equal(inferDisciplina(file), "Eletrônica Digital");
});

test("ignora pasta de topico numerado e sobe para disciplina", () => {
    const file = makeFile(
        "/S05/IAI - Introducao a Automacao Industrial/2023.1 - PH/02-Tunel de Vento/Relatorio Final.docx",
        "Relatorio Final.docx",
        "docx",
    );
    assert.equal(inferDisciplina(file), "Introdução à Automação Industrial e Controle");
});

test("detecta sufixo numerico longo como garbage id", () => {
    const file = makeFile(
        "/S01/CA - Calculo I/2014.2 - Fernando Macedo/doc_calculo__1400999240.doc",
        "doc_calculo__1400999240.doc",
        "doc",
    );
    assert.equal(normalizeTitle(file), "Calculo I - Material Complementar (2014.2)");
});

test("classifica arquivo matlab tecnico como projeto", () => {
    const file = makeFile(
        "/S05/IAI - Introducao a Automacao Industrial/2023.1 - PH/controlador_final.m",
        "controlador_final.m",
        "m",
    );
    assert.equal(inferTipo(file), "Trabalho/Projeto");
});

test("nao remove sufixo hifenado quando nao ha contexto academico para professor", () => {
    const file = makeFile(
        "/S01/Engenharia - Alisson/Anotacoes.pdf",
        "Anotacoes.pdf",
        "pdf",
    );
    assert.equal(inferDisciplina(file), "Engenharia - Alisson");
});

test("usa semestre da grade quando nao existe ano letivo", () => {
    const file = makeFile("/S10/EF - Etica e Filosofia/material.txt", "material.txt", "txt");
    assert.equal(inferSemester(file), "Grade S10");
});

test("contextualiza titulo generico com disciplina e tipo", () => {
    const file = makeFile("/S10/EF - Etica e Filosofia/material.txt", "material.txt", "txt");
    assert.equal(normalizeTitle(file), "Ética e Filosofia - Material Complementar");
});

test("remove sufixos de copia e versao do titulo", () => {
    const file = makeFile("/S01/CA - Calculo I/2024.1 - PH/Cópia de Prova_v2_editado.pdf", "Cópia de Prova_v2_editado.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Calculo I - Prova - 2024.1");
});

test("prioriza contexto da disciplina apos pasta Sxx", () => {
    const file = makeFile("../provas//S01/CA - Calculo I/2010.2/Cadeiras com o Ronaldo/N1/Prova 1.jpg", "Prova 1.jpg", "jpg");
    assert.equal(inferDisciplina(file), "Calculo I");
    assert.equal(normalizeTitle(file), "Prova - Calculo I (Parte 01)");
});

test("normaliza aliases novos de professor", () => {
    const tagsMacedo = inferTags(makeFile("/S01/CA - Calculo I/2024.1 - Macedo/AP1.pdf", "AP1.pdf", "pdf"));
    const tagsSerra = inferTags(makeFile("/S04/BD - Banco de Dados/2024.1 - Serra/Projeto.pdf", "Projeto.pdf", "pdf"));
    const tagsNarcelio = inferTags(makeFile("/S04/BD - Banco de Dados/2024.1 - Narcélio/Projeto.pdf", "Projeto.pdf", "pdf"));

    assert.ok(tagsMacedo.includes("Fernando Macedo"));
    assert.ok(tagsSerra.includes("Serra"));
    assert.ok(tagsNarcelio.includes("Narcélio Pinto"));
});

test("herda tipo prova de pasta pai de avaliacao para imagem", () => {
    const file = makeFile("/S01/CA - Calculo I/2024.1 - PH/N2/foto_prova.png", "foto_prova.png", "png");
    assert.equal(inferTipo(file), "Prova");
});

test("trata readme de raiz e src como ruido", () => {
    const rootReadme = makeFile("/README.md", "README.md", "md");
    const srcReadme = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/src/README.md", "README.md", "md");
    assert.equal(inferMetadata(rootReadme), null);
    assert.equal(inferMetadata(srcReadme), null);
});

test("limpa codigos e redundancia em titulo de PUD", () => {
    const file = makeFile("/Documentos/PUDS/S01/CA - Calculo I/1916473-O PUD Calculo I.pdf", "1916473-O PUD Calculo I.pdf", "pdf");
    assert.equal(normalizeTitle(file), "CA - Plano de Ensino");
});

test("preserva numero significativo apos prefixo numerico de upload", () => {
    const file = makeFile("/S01/CA - Calculo I/2024.1 - PH/1454722-prova11.jpg", "1454722-prova11.jpg", "jpg");
    assert.equal(normalizeTitle(file), "Prova 11");
});

test("mantem codigo quando nome indica projeto em contexto novo", () => {
    const file = makeFile("/PROJETO-TOP/Entrega Final/projeto_final.py", "projeto_final.py", "py");
    assert.notEqual(inferMetadata(file, { filterCodeFiles: true }), null);
});

test("remove tags redundantes quando sigla ja representa disciplina", () => {
    const tags = inferTags(makeFile("/BEPID-Apple/2014/Projeto 1.docx", "Projeto 1.docx", "docx"));
    assert.ok(!tags.includes("BEPID"));
    assert.ok(tags.includes("BEPID Apple"));
});

test("remove tag de disciplina quando sigla cobre variacao do nome", () => {
    const tags = inferTags(makeFile("/S01/CA - Calculo I/2024.1 - PH/Lista 1.pdf", "Lista 1.pdf", "pdf"));
    assert.ok(tags.includes("CA"));
    assert.ok(tags.includes("Calculo I"));
});

test("nao trata nome scanner com multiplos numeros como parte", () => {
    const file = makeFile("/S02/CA - Calculo II/2024.1 - PH/cal 2-1-2.jpg", "cal 2-1-2.jpg", "jpg");
    const title = normalizeTitle(file);
    assert.ok(!title.includes("(Parte"));
});

test("adiciona tag generica professor para docente nao mapeado", () => {
    const file = makeFile("/S02/LM - Logica Matematica/2024.1 - Joao Gabriel Silva/Anotacoes.pdf", "Anotacoes.pdf", "pdf");
    const tags = inferTags(file);
    assert.ok(tags.includes("Professor"));
    assert.ok(tags.includes("JOAO GABRIEL SILVA"));
});

test("remove nome da disciplina de titulo generico de anotacoes", () => {
    const file = makeFile("/S02/LM - Logica Matematica/2024.1 - PH/Anotações Lógica Matemática.pdf", "Anotações Lógica Matemática.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Anotações");
});

test("enriquece titulo quando igual a disciplina", () => {
    const file = makeFile("../provas/S01/CA - Cálculo I/2010.2/calculo I.pdf", "calculo I.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Cálculo I - Material Principal");
});

test("filtra arquivos de sistema e temporarios do Word", () => {
    const thumbs = makeFile("/S01/CA - Calculo I/2024.1 - PH/Thumbs.db", "Thumbs.db", "db");
    const tempWord = makeFile("/S01/CA - Calculo I/2024.1 - PH/~$Prova.docx", "~$Prova.docx", "docx");
    assert.equal(inferMetadata(thumbs), null);
    assert.equal(inferMetadata(tempWord), null);
});

test("filtra extensoes adicionais de ruido", () => {
    const logFile = makeFile("/S01/CA - Calculo I/2024.1 - PH/WS_FTP.LOG", "WS_FTP.LOG", "LOG");
    const exeFile = makeFile("/S01/CA - Calculo I/2024.1 - PH/Daedalus.exe", "Daedalus.exe", "exe");
    const jarFile = makeFile("/S01/CA - Calculo I/2024.1 - PH/Mars_4_1.jar", "Mars_4_1.jar", "jar");
    const infoFile = makeFile("/S01/CA - Calculo I/2024.1 - PH/ZbThumbnail.info", "ZbThumbnail.info", "info");
    const rptFile = makeFile("/S01/CA - Calculo I/2024.1 - PH/relatorio.rpt", "relatorio.rpt", "rpt");
    const summaryFile = makeFile("/S01/CA - Calculo I/2024.1 - PH/build.summary", "build.summary", "summary");

    assert.equal(inferMetadata(logFile), null);
    assert.equal(inferMetadata(exeFile), null);
    assert.equal(inferMetadata(jarFile), null);
    assert.equal(inferMetadata(infoFile), null);
    assert.equal(inferMetadata(rptFile), null);
    assert.equal(inferMetadata(summaryFile), null);
});

test("preserva ano no inicio de nome de prova", () => {
    const file = makeFile("/S01/CA - Calculo I/2024.1 - PH/2019-Prova.pdf", "2019-Prova.pdf", "pdf");
    assert.equal(normalizeTitle(file), "2019-Prova");
});

test("remove colchetes vazios apos limpeza", () => {
    const file = makeFile("/S01/CA - Calculo I/2024.1 - PH/Lista 1 [v2] - Respostas.pdf", "Lista 1 [v2] - Respostas.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Gabarito - Lista 1");
});

test("padroniza listagem ordinal para lista numerada", () => {
    const file = makeFile(
        "/S01/MI - Mecatronica/2024.1 - PH/2a_listagem_Mecatronica.pdf",
        "2a_listagem_Mecatronica.pdf",
        "pdf",
    );
    assert.equal(normalizeTitle(file), "Lista 2 - Mecatronica");
});

test("prioriza nome explicito de pasta sigla-nome sobre mapa de siglas", () => {
    const file = makeFile("/S03/ED - Equacoes Diferenciais/2024.1 - PH/Lista1.pdf", "Lista1.pdf", "pdf");
    assert.equal(inferDisciplina(file), "Equacoes Diferenciais");
});

test("descarta extensao db_info como ruído", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/relogio.db_info", "relogio.db_info", "db_info");
    assert.equal(inferMetadata(file), null);
});

test("contextualiza titulo generico com professor quando disciplina e geral", () => {
    const file = makeFile("/Cadeiras com o Ronaldo/material.pdf", "material.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Outros - Prof. Ronaldo Fernandes Ramos - Material Complementar");
});

test("usa contexto em imagens genericas de prova", () => {
    const file = makeFile("/S01/CA - Calculo I/2024.1 - PH/Provas/IMG_2023.jpg", "IMG_2023.jpg", "jpg");
    assert.equal(normalizeTitle(file), "Prova - Calculo I - 2024.1 (Imagem)");
});

test("herda contexto para imagem em pasta ignorada", () => {
    const file = makeFile("../provas//S01/CA - Calculo I/2022.1 - Roberto Carlos/pics/1questao.jpeg", "1questao.jpeg", "jpeg");
    assert.equal(normalizeTitle(file), "Calculo I - Questão 1 (2022.1)");
});

test("preserva nome descritivo em imagem de pasta ignorada", () => {
    const file = makeFile("/Cadeiras com o Ronaldo/Lasca Ronaldo.gif", "Lasca Ronaldo.gif", "gif");
    assert.equal(normalizeTitle(file), "Lasca Ronaldo");
});

test("prioriza projeto para hardware fora de pasta provas", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/N1/MI.dsn", "MI.dsn", "dsn");
    assert.equal(inferTipo(file), "Trabalho/Projeto");
});

test("mantem prova para hardware em pasta provas explicita", () => {
    const file = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/Provas/MI.dsn", "MI.dsn", "dsn");
    assert.equal(inferTipo(file), "Prova");
});

test("deduplica sigla resolvida quando disciplina completa existe", () => {
    const tags = inferTags(makeFile("/S04/Processamento Digital de Sinais/2020.2 - Ricardo Rodriges/AP1.png", "AP1.png", "png"));
    assert.ok(!tags.includes("PDS"));
    assert.ok(tags.includes("Processamento Digital de Sinais"));
});

test("usa fallback contextual para nomes lixo com ids numericos", () => {
    const file = makeFile(
        "/S03/AC - Arquitetura de Computadores/2022.1 - PH/537122_321876307865798_999999999_n.jpg",
        "537122_321876307865798_999999999_n.jpg",
        "jpg",
    );
    assert.equal(normalizeTitle(file), "Arquitetura de Computadores - Prova (2022.1)");
});

test("classifica python tecnico como script simulacao quando nao e projeto", () => {
    const file = makeFile(
        "/S05/IAI - Introducao a Automacao Industrial/2024.1 - PH/Aula 03/simulacao_motor.py",
        "simulacao_motor.py",
        "py",
    );
    assert.equal(inferTipo(file), "Script/Simulação");
});

test("classifica python de IP como trabalho projeto", () => {
    const file = makeFile(
        "/S01/IP - Introducao a Programacao/2024.1 - PH/atividade_01.py",
        "atividade_01.py",
        "py",
    );
    assert.equal(inferTipo(file), "Trabalho/Projeto");
    assert.notEqual(inferTipo(file), "Script/Simulação");
});

test("classifica imagem em pasta de aula como material de aula", () => {
    const file = makeFile(
        "/S05/IAI - Introducao a Automacao Industrial/2024.1 - PH/Aulas/Aula 03/diagrama.png",
        "diagrama.png",
        "png",
    );
    assert.equal(inferTipo(file), "Material de Aula");
});

test("prioriza pasta de aula mesmo quando raiz e provas", () => {
    const file = makeFile(
        "../provas//S05/IAI - Introducao a Automacao Industrial/2024.1 - PH/Aulas/Aula 01/diagrama.png",
        "diagrama.png",
        "png",
    );
    assert.equal(inferTipo(file), "Material de Aula");
    assert.ok(!/^Prova\b/i.test(normalizeTitle(file)));
});

test("remove professor do nome da disciplina em pasta sigla-nome", () => {
    const file = makeFile(
        "/S01/CA - Calculo I - Fernando Macedo/2014.2/N1.pdf",
        "N1.pdf",
        "pdf",
    );
    assert.equal(inferDisciplina(file), "Calculo I");
    const tags = inferTags(file);
    assert.ok(tags.includes("Fernando Macedo"));
});

test("ignora git com barras duplas antes do processamento", () => {
    const file = makeFile("../provas//.git/FETCH_HEAD", "FETCH_HEAD", "");
    assert.equal(inferMetadata(file), null);
});

test("extrai disciplina do nome do repositorio quando aplicavel", () => {
    const file = makeFile(
        "../IAI - Introducao a Automacao Industrial/src/images/repo.jpg",
        "repo.jpg",
        "jpg",
    );
    assert.equal(inferDisciplina(file), "Introdução à Automação Industrial e Controle");
});

test("preserva diacriticos maiusculos em titulos limpos", () => {
    const file = makeFile("/S03/ATC - Aspectos Teoricos da Computacao/2024.1 - PH/lista-INDUÇÃO.pdf", "lista-INDUÇÃO.pdf", "pdf");
    assert.equal(normalizeTitle(file), "INDUÇÃO");
});

test("separa palavras coladas em lista com camel case", () => {
    const file = makeFile(
        "/S02/EA - Eletronica Analogica/2024.1 - PH/1aListadeExercíciosEletrônicaComputação.pdf",
        "1aListadeExercíciosEletrônicaComputação.pdf",
        "pdf",
    );
    assert.equal(normalizeTitle(file), "Lista 1 - Exercícios Eletrônica Computação");
});

test("classifica extensoes tecnicas novas como projeto", () => {
    const afFile = makeFile("/S03/ATC - Aspectos Teoricos da Computacao/2024.1 - PH/automato.af", "automato.af", "af");
    const idlFile = makeFile("/S04/PPD - Programacao Paralela e Distribuida/2024.1 - PH/cliente.idl", "cliente.idl", "idl");
    const mcpFile = makeFile("/S05/MI - Microcontroladores/2024.1 - PH/projeto_final.mcp", "projeto_final.mcp", "mcp");

    assert.equal(inferTipo(afFile), "Trabalho/Projeto");
    assert.equal(inferTipo(idlFile), "Trabalho/Projeto");
    assert.equal(inferTipo(mcpFile), "Trabalho/Projeto");
    const tags = inferTags(mcpFile);
    assert.ok(!tags.includes("Hardware"));
    assert.ok(tags.includes("Projeto"));
});

test("prioriza estagio da pasta sobre nome da prova", () => {
    const file = makeFile(
        "/S04/PDS - Processamento Digital de Sinais/2017.1 - Ricardo Rodriges/N2/prova 1.jpeg",
        "prova 1.jpeg",
        "jpeg",
    );
    const tags = inferTags(file);
    assert.ok(tags.includes("AV2"));
    assert.ok(!tags.includes("AV1"));
});

test("preserva multiplos estagios no nome sem sobrescrever", () => {
    const file = makeFile("/S03/EDA - Estrutura de Dados/2021.2 - PH/P1_P2.pdf", "P1_P2.pdf", "pdf");
    const tags = inferTags(file);
    assert.ok(tags.includes("AV1"));
    assert.ok(tags.includes("AV2"));
});

test("remove preposicao orfa apos limpar respostas", () => {
    const file = makeFile("/S01/CA - Calculo I/2024.1 - PH/LIMITES COM RESPOSTAS.pdf", "LIMITES COM RESPOSTAS.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Gabarito - LIMITES");
});

test("filtra src images com path relativo e barras duplicadas", () => {
    const file = makeFile("../provas//src/images/figura.png", "figura.png", "png");
    assert.equal(inferMetadata(file), null);
});

test("classifica matlab em sistemas lineares como script", () => {
    const file = makeFile("/S05/SL - Sistemas Lineares/2024.1 - PH/rotacao_cubo.m", "rotacao_cubo.m", "m");
    assert.equal(inferTipo(file), "Script/Simulação");
});

test("prefixa gabarito quando categoria vem do contexto", () => {
    const file = makeFile("/S01/CA - Calculo/2024.1 - PH/Gabaritos/Lista 1.pdf", "Lista 1.pdf", "pdf");
    assert.equal(inferTipo(file), "Gabarito/Resolução");
    assert.equal(normalizeTitle(file), "Gabarito - Lista 1");
});

test("captura sigla com underscore sem espacos", () => {
    const file = makeFile("/S02/EA_Eletronica Analogica/2024.1 - PH/Lista1.pdf", "Lista1.pdf", "pdf");
    assert.equal(inferDisciplina(file), "Eletrônica Analógica");
});

test("captura sigla com hifen sem espaco antes", () => {
    const file = makeFile("/S02/EA- Eletronica Analogica/2024.1 - PH/Lista1.pdf", "Lista1.pdf", "pdf");
    assert.equal(inferDisciplina(file), "Eletrônica Analógica");
});

test("diferencia calculo por nivel no caminho", () => {
    const file = makeFile("/S02/CA/Calculo II/2024.1 - PH/Lista1.pdf", "Lista1.pdf", "pdf");
    assert.equal(inferDisciplina(file), "Calculo II");
});

test("especializa fisica por semestre da grade", () => {
    // FE em S02 → Física-Eletricidade; FE em S03 → Físico-Eletromagnetismo
    const s02 = makeFile("/S02/FE - Fisica/2024.1 - PH/Lista 1.pdf", "Lista 1.pdf", "pdf");
    assert.equal(inferDisciplina(s02), "Física-Eletricidade");
    const s03 = makeFile("/S03/FE - Fisica/2024.1 - PH/Lista 1.pdf", "Lista 1.pdf", "pdf");
    assert.equal(inferDisciplina(s03), "Físico-Eletromagnetismo");
});

test("prioriza resolucao para arquivos de ferramentas", () => {
    const file = makeFile("/S01/CA - Calculo/2024.1 - PH/gabarito derivative Wolfram Alpha.pdf", "gabarito derivative Wolfram Alpha.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Resolução - Derivative Wolfram Alpha");
});

test("remove prefixo numerico residual antes de lista", () => {
    const file = makeFile("/S01/CA - Calculo I/2024.1 - PH/1150511-1_-_5ªListadeExercicios.pdf", "1150511-1_-_5ªListadeExercicios.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Lista 5 - Exercicios");
});

test("trata readme sem extensao como ruido", () => {
    const readmeInBuild = makeFile("/S05/MI - Microcontroladores/2022.2 - PH/quartus/incremental_db/README", "README", "");
    assert.equal(inferMetadata(readmeInBuild), null);
});

test("infere disciplina em pasta de professor por contexto tecnico", () => {
    const file = makeFile("/Cadeiras com o Ronaldo/bubblesort.ipynb", "bubblesort.ipynb", "ipynb");
    assert.equal(inferDisciplina(file), "Pesquisa e Ordenação");
});

test("desambigua ronaldo para padroes de projeto", () => {
    const file = makeFile("/Cadeiras com o Ronaldo/factory-pattern-observer.pdf", "factory-pattern-observer.pdf", "pdf");
    assert.equal(inferDisciplina(file), "Padrões de Projeto");
});

test("filtra imagens de documentacao em src/images", () => {
    const file = makeFile(
        "../IAI - Introducao a Automacao Industrial/src/images/commit.jpg",
        "commit.jpg",
        "jpg",
    );
    assert.equal(inferMetadata(file), null);
});

test("nao confunde mojibake de maiuscula acentuada com a-grave", () => {
    const file = makeFile("/S03/ATC - Aspectos Teoricos da Computacao/2024.1 - PH/Ãrvore.pdf", "Ãrvore.pdf", "pdf");
    assert.equal(normalizeTitle(file), "Árvore");
});

test("usa contexto de aula para imagem generica em pasta topic", () => {
    const file = makeFile(
        "../provas//S05/SL - Sistemas Lineares/2016.2 - PH/Aula 01-11/IMG_20161101_173803469.jpg",
        "IMG_20161101_173803469.jpg",
        "jpg",
    );
    assert.equal(normalizeTitle(file), "Sistemas Lineares - Aula 01-11 - Imagem");
});

test("remove ano isolado do titulo quando semestre e YYYY", () => {
    const file = makeFile("/BEPID-Apple/2014/BEPID 2014(Turma 2015).pdf", "BEPID 2014(Turma 2015).pdf", "pdf");
    assert.equal(normalizeTitle(file), "BEPID (Turma 2015)");
});
