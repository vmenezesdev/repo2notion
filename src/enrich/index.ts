import { RecordCandidate, RepoFile } from "../types";

const NOISE_PATH_MARKERS = [
    "/.git/",
    "/.github/",
    "/.idea/",
    "/.vscode/",
    "/node_modules/",
    "/dist/",
    "/build/",
    "/coverage/",
    "/logs/",
    "/refs/",
    "/lfs/",
    "/__pycache__/",
    "/venv/",
    "/.venv/",
    "/conteudo anterior/",
    "/conteúdo anterior/",
];

const NOISE_FILE_NAMES = new Set([
    ".ds_store",
    "thumbs.db",
    "desktop.ini",
    ".gitignore",
    ".gitattributes",
    ".editorconfig",
]);

const NOISE_EXTENSIONS = new Set([
    "tmp",
    "temp",
    "bak",
    "old",
    "orig",
    "swp",
    "lock",
]);

const SEMESTER_REGEXES = [
    /\b((?:19|20)\d{2})[._\-\s]([12])\b/g,
    /\b((?:19|20)\d{2})([12])\b/g,
];

const DISCIPLINA_BY_SIGLA: Record<string, string> = {
    CA: "Cálculo",
    CALC: "Cálculo",
    ED: "Eletrônica Digital",
    ELETRODIG: "Eletrônica Digital",
    LM: "Lógica Matemática",
    EDA: "Estrutura de Dados",
    ED1: "Estrutura de Dados",
    ED2: "Estrutura de Dados II",
    ATC: "Aspectos Teóricos da Computação",
    IAI: "Automação Industrial",
    POO: "Programação Orientada a Objetos",
    LP: "Linguagem de Programação",
    SO: "Sistemas Operacionais",
    SD: "Sistemas Distribuídos",
    RC: "Redes de Computadores",
    BD: "Banco de Dados",
    IA: "Inteligência Artificial",
    CG: "Computação Gráfica",
    ENGSOFT: "Engenharia de Software",
    ES: "Engenharia de Software",
    FE: "Física",
    IP: "Introdução à Programação",
    PE: "Probabilidade e Estatística",
    PSI: "Projeto de Sistemas de Informação",
    STR: "Sistemas de Tempo Real",
    PPD: "Programação Paralela e Distribuída",
    EG: "Empreendedorismo e Gestão",
    VC: "Visão Computacional",
    PT: "Produção Textual",
    TCC: "Trabalho de Conclusão de Curso",
    BEPID: "BEPID Apple",
};

const TIPO_PATTERNS = {
    prova: [
        /(^|\b)(p[1-4]|ap[1-4]|av[1-4]|af|prova|avaliac[aã]o|simulado)(\b|$)/i,
        /(\/|\b)(provas?|avaliac(?:oes|o(?:es)?)|simulados?)(\/|\b)/i,
    ],
    lista: [
        /(^|\b)(lista|exerc[ií]c(?:io|ios)?|folha\s*de\s*exerc[ií]cios?|td)(\b|$)/i,
        /(\/|\b)(listas?|exercicios?|tutoriais?)(\/|\b)/i,
    ],
    aula: [
        /(^|\b)(aula|slides?|pud|apresentac[aã]o|material\s*de\s*apoio|apostila)(\b|$)/i,
        /(\/|\b)(aulas?|slides?|material(?:\s*de)?\s*apoio|monitoria)(\/|\b)/i,
    ],
    projeto: [
        /(^|\b)(trabalho|projeto(?:\s*final)?|semin[aá]rio|relat[oó]rio|lab(?:orat[oó]rio)?)(\b|$)/i,
        /(\/|\b)(trabalhos?|projetos?|labs?|laboratorios?)(\/|\b)/i,
    ],
    resumo: [
        /(^|\b)(resumo|anota[cç][oõ]es?|caderno|mapa\s*mental|cola)(\b|$)/i,
    ],
    documentacao: [
        /(^|\b)(manual|guia|roteiro|aviso|ementa|cronograma|instru[cç][aã]o|documenta[cç][aã]o)(\b|$)/i,
        /(\/|\b)(documentos?|docs?|guias?|avisos?)(\/|\b)/i,
    ],
};

const MATERIAL_FOLDER_PATTERN = /(\/|\b)(puds?|material(?:\s*de)?\s*apoio|monitoria)(\/|\b)/i;
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg", "heic"]);
const TEXT_EXTENSIONS = new Set(["txt", "md", "rtf", "doc", "docx", "odt"]);

const TAG_BY_EXTENSION: Record<string, string> = {
    c: "C",
    h: "C",
    cpp: "C++",
    cxx: "C++",
    hpp: "C++",
    py: "Python",
    java: "Java",
    js: "JavaScript",
    ts: "TypeScript",
    sql: "SQL",
    m: "MATLAB",
    ipynb: "Jupyter",
    dsn: "Proteus",
    pdsprj: "Proteus",
    tex: "LaTeX",
    png: "Imagem",
    jpg: "Imagem",
    jpeg: "Imagem",
    gif: "Imagem",
    svg: "Imagem",
    txt: "Texto",
    md: "Texto",
    rar: "Compactado",
    zip: "Compactado",
    "7z": "Compactado",
};

function safeString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function normalizePath(path: unknown): string {
    return safeString(path).replace(/\\/g, "/").replace(/\/+/g, "/");
}

function stripDiacritics(value: unknown): string {
    return safeString(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function fixMojibake(value: unknown): string {
    const safeValue = safeString(value);

    if (!/[ÃÂ]/.test(safeValue)) {
        return safeValue;
    }

    const replacements: Array<[RegExp, string]> = [
        [/Ã¡/g, "á"],
        [/Ã /g, "à"],
        [/Ã¢/g, "â"],
        [/Ã£/g, "ã"],
        [/Ã¤/g, "ä"],
        [/Ã©/g, "é"],
        [/Ã¨/g, "è"],
        [/Ãª/g, "ê"],
        [/Ã«/g, "ë"],
        [/Ã­/g, "í"],
        [/Ã¬/g, "ì"],
        [/Ã®/g, "î"],
        [/Ã¯/g, "ï"],
        [/Ã³/g, "ó"],
        [/Ã²/g, "ò"],
        [/Ã´/g, "ô"],
        [/Ãµ/g, "õ"],
        [/Ã¶/g, "ö"],
        [/Ãº/g, "ú"],
        [/Ã¹/g, "ù"],
        [/Ã»/g, "û"],
        [/Ã¼/g, "ü"],
        [/Ã§/g, "ç"],
        [/Ã/g, "Á"],
        [/Ã€/g, "À"],
        [/Ã‚/g, "Â"],
        [/Ãƒ/g, "Ã"],
        [/Ã„/g, "Ä"],
        [/Ã‰/g, "É"],
        [/Ãˆ/g, "È"],
        [/ÃŠ/g, "Ê"],
        [/Ã‹/g, "Ë"],
        [/Ã/g, "Í"],
        [/ÃŒ/g, "Ì"],
        [/ÃŽ/g, "Î"],
        [/Ã/g, "Ï"],
        [/Ã“/g, "Ó"],
        [/Ã’/g, "Ò"],
        [/Ã”/g, "Ô"],
        [/Ã•/g, "Õ"],
        [/Ã–/g, "Ö"],
        [/Ãš/g, "Ú"],
        [/Ã™/g, "Ù"],
        [/Ã›/g, "Û"],
        [/Ãœ/g, "Ü"],
        [/Ã‡/g, "Ç"],
        [/Ã_n/g, "ún"],
        [/Ã_o/g, "ão"],
        [/Ã_/g, "ç"],
        [/Ã(?=[\s])/g, "ã"],
        [/Âº/g, "º"],
        [/Âª/g, "ª"],
        [/Â°/g, "°"],
        [/Â/g, ""],
    ];

    let fixed = safeValue;
    for (const [pattern, replacement] of replacements) {
        fixed = fixed.replace(pattern, replacement);
    }

    return fixed;
}

function normalizeText(value: unknown): string {
    return fixMojibake(value)
        .normalize("NFKC")
        .replace(/[_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeComparable(value: unknown): string {
    return stripDiacritics(normalizeText(value)).toLowerCase();
}

function normalizeSigla(value: unknown): string {
    return normalizeComparable(value).replace(/[^a-z0-9]/g, "").toUpperCase();
}

function getSemesterFromText(value: unknown): string {
    const text = normalizeComparable(value);

    for (const regex of SEMESTER_REGEXES) {
        regex.lastIndex = 0;
        const match = regex.exec(text);
        if (match) {
            return `${match[1]}.${match[2]}`;
        }
    }

    return "";
}

function getSubjectPart(path: unknown): string {
    const normalizedPath = normalizePath(path);
    const parts = normalizedPath.split("/").filter(Boolean);

    const bySemesterFolder = normalizedPath.match(/\/S\d{2}\/([^/]+)/i)?.[1];
    if (bySemesterFolder) {
        return fixMojibake(bySemesterFolder.trim());
    }

    const siglaNamePattern = /^\s*[A-Za-z]{2,10}\s*-\s*.+$/;
    const bySiglaAndName = parts.find((part) => siglaNamePattern.test(part));
    if (bySiglaAndName) {
        return fixMojibake(bySiglaAndName.trim());
    }

    for (const part of parts) {
        const comparable = normalizeComparable(part);
        const sigla = normalizeSigla(part);
        if (!part.trim() || /^s\d{2}$/i.test(part) || /^\d{4}[._\-\s]?[12]$/.test(comparable)) {
            continue;
        }

        if (DISCIPLINA_BY_SIGLA[sigla]) {
            return fixMojibake(part.trim());
        }
    }

    return fixMojibake(
        parts.find((part) => /\s-\s/.test(part) && !/\d{4}[._\-\s]?[12]/.test(part))?.trim() ?? "",
    );
}

function getSiglaAndName(subjectPart: string): { sigla: string; name: string } {
    if (!subjectPart) {
        return { sigla: "", name: "" };
    }

    const normalizedSubject = fixMojibake(subjectPart).trim();
    const [siglaRaw, ...nameParts] = normalizedSubject.split(/\s-\s/);
    const sigla = normalizeSigla(siglaRaw ?? "");
    const name = nameParts.join(" - ").trim();

    if (!name && normalizedSubject && DISCIPLINA_BY_SIGLA[sigla]) {
        return { sigla, name: DISCIPLINA_BY_SIGLA[sigla] };
    }

    return { sigla, name };
}

function isNoiseFile(file: RepoFile | null | undefined): boolean {
    const normalizedPath = `/${normalizeComparable(normalizePath(file?.path))}/`;
    const normalizedName = normalizeComparable(file?.name);
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");

    if (NOISE_PATH_MARKERS.some((marker) => normalizedPath.includes(marker))) {
        return true;
    }
    if (NOISE_FILE_NAMES.has(normalizedName)) {
        return true;
    }
    if (NOISE_EXTENSIONS.has(extension)) {
        return true;
    }

    return normalizedName.startsWith("~$") || normalizedName.startsWith(".") || normalizedName.endsWith(".tmp");
}

function getAssessmentLabel(nameWithoutExt: string): string {
    const text = normalizeComparable(nameWithoutExt);

    const partialMatch = text.match(/\b(?:ap|av|p|avaliacao|prova)\s*parcial\s*(\d)\b/i);
    if (partialMatch) {
        return `AV${partialMatch[1]}`;
    }

    const compactMatch = text.match(/\b(ap|av|p|n)\s*(\d)\b/i);
    if (compactMatch) {
        const prefix = compactMatch[1].toUpperCase();
        const grade = compactMatch[2];
        if (prefix === "N") {
            return `N${grade}`;
        }
        return `AV${grade}`;
    }

    if (text.includes("final") || /\baf\b/i.test(text)) {
        return "AF";
    }

    return "";
}

/**
 * Dado um arquivo com contexto, inferir os metadados que formarão o registro candidato para o Notion.
 * Produz um registro candidato para o banco do Notion, inferindo título, tipo, disciplina, 
 * semestre e tags a partir do nome do arquivo e do caminho em que ele aparece.
 * ### Exemplo
 * ```js
 * {
 *    kind: "file",
 *    name: "AP2.pdf",
 *    path: "./SD/2020.2/AP2.pdf",
 * }
 * ```
 *  -> 
 * 
 * ```js
 * {
 *  title: "AP2 - 2020.2",
 *  tipo: "Prova Passada",
 *  disciplina: "Sistemas Distribuídos",
 *  semester: "2020.2",
 *  tags: ["AP2"],
 *  sourcePath: "/SD/2020.2/AP2.pdf"
 * }
 * ```
 */
export function inferMetadata(file: RepoFile | null | undefined): RecordCandidate | null {
    if (!file) {
        return null;
    }

    if (isNoiseFile(file)) {
        return null;
    }

    const sourcePath = normalizePath(file.path);

    return {
        title: normalizeTitle(file),
        tipo: inferTipo(file),
        disciplina: inferDisciplina(file),
        semester: inferSemester(file),
        tags: inferTags(file),
        sourcePath,
    };
}

export function normalizeTitle(file: RepoFile | null | undefined): string {
    const semester = inferSemester(file);
    const originalName = safeString(file?.name);
    const nameWithoutExt = fixMojibake(originalName.replace(/\.[^/.]+$/, ""));
    let cleanedName = normalizeText(nameWithoutExt)
        .replace(/^\d{5,}[-_\s]*/, "")
        .replace(/\b(?:pdf|docx?|pptx?|xlsx?|jpe?g|png|txt|zip|rar|7z)\b/gi, "")
        .replace(/^\s*(PUD|AV\d?|AP\d?|AVALIACAO|AVALIAÇÃO|PROVA|LISTA)\b\s*/gi, "")
        .replace(/^(?:\d+[)\]]\s*|\d+(?:[.\-_]\d+)+[.\-_]?\s*|\d+[.\-_]\s*)/, "")
        .replace(/[._\-]/g, " ")
        .replace(/\s*\(\s*(?:copia|copy)\s*\d*\s*\)\s*$/i, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleanedName) {
        cleanedName = normalizeText(nameWithoutExt);
    }

    cleanedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);

    const assessmentLabel = getAssessmentLabel(cleanedName);
    if (
        semester &&
        assessmentLabel &&
        (normalizeComparable(cleanedName) === normalizeComparable(assessmentLabel) ||
            normalizeComparable(cleanedName).startsWith(normalizeComparable(assessmentLabel) + " "))
    ) {
        return `${assessmentLabel} - ${semester}`;
    }

    return cleanedName || normalizeText(nameWithoutExt) || originalName;
}

export function inferTipo(file: RepoFile | null | undefined): string {
    const name = normalizeComparable(file?.name);
    const path = normalizeComparable(normalizePath(file?.path));
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");

    const isAula = TIPO_PATTERNS.aula.some((pattern) => pattern.test(name) || pattern.test(path));
    const isLista = TIPO_PATTERNS.lista.some((pattern) => pattern.test(name) || pattern.test(path));
    const isResumo = TIPO_PATTERNS.resumo.some((pattern) => pattern.test(name) || pattern.test(path));
    const isProva = TIPO_PATTERNS.prova.some((pattern) => pattern.test(name) || pattern.test(path));
    const isDocumentacao =
        TIPO_PATTERNS.documentacao.some((pattern) => pattern.test(name) || pattern.test(path)) ||
        TEXT_EXTENSIONS.has(extension);
    const isMaterialFolder = MATERIAL_FOLDER_PATTERN.test(path);
    const isPlanoDeEnsino = /\bpud\b/i.test(name) || /\bpud\b/i.test(path);
    const isProvasFolder = /(^|\/)provas?(\/|$)/i.test(path);

    if (isProva && isProvasFolder) {
        return "Prova";
    }

    if (isProva && IMAGE_EXTENSIONS.has(extension)) {
        return "Prova";
    }

    if (isPlanoDeEnsino) {
        return "Plano de Ensino";
    }

    if (isLista) {
        return "Lista de Exercícios";
    }

    if (isAula || (isMaterialFolder && !isProva)) {
        return "Material de Aula";
    }

    if (isDocumentacao && !isProva) {
        return "Documentação";
    }

    if (TIPO_PATTERNS.projeto.some((pattern) => pattern.test(name) || pattern.test(path)) || ["py", "c", "java", "pdsprj", "dsn", "cpp", "js", "ts"].includes(extension)) {
        return "Trabalho/Projeto";
    }

    if (isResumo) {
        return "Resumo";
    }

    if (isProva) {
        return "Prova";
    }

    if (IMAGE_EXTENSIONS.has(extension)) {
        return "Material Complementar";
    }

    return "Material Complementar";
}

export function inferDisciplina(file: RepoFile | null | undefined): string {
    const subjectPart = getSubjectPart(normalizePath(file?.path));
    const { sigla, name } = getSiglaAndName(subjectPart);

    if (DISCIPLINA_BY_SIGLA[sigla]) {
        return DISCIPLINA_BY_SIGLA[sigla];
    }

    if (name) {
        return fixMojibake(name);
    }

    return fixMojibake(subjectPart);
}

export function inferSemester(file: RepoFile | null | undefined): string {
    return getSemesterFromText(`${normalizePath(file?.path)} ${safeString(file?.name)}`);
}

export function inferTags(file: RepoFile | null | undefined): string[] {
    const tags = new Set<string>();
    const normalizedPath = normalizePath(file?.path);
    const fileName = safeString(file?.name);
    const subjectPart = getSubjectPart(normalizedPath);
    const { sigla } = getSiglaAndName(subjectPart);
    const semester = inferSemester(file);
    const tipo = inferTipo(file);
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");
    const upperPath = normalizeComparable(normalizedPath).toUpperCase();

    if (sigla) {
        tags.add(sigla);
    }

    if (semester) {
        tags.add(semester);
    }

    const semesterFolderMatch = normalizeComparable(normalizedPath).match(/\/s(\d{2})\//i);
    if (semesterFolderMatch) {
        const semesterNumber = Number(semesterFolderMatch[1]);
        if (Number.isFinite(semesterNumber) && semesterNumber > 0) {
            tags.add(`${semesterNumber}-Semestre`);
        }
    }

    if (tipo === "Prova") {
        const provaTag = getAssessmentLabel(fileName.replace(/\.[^/.]+$/, ""));
        if (provaTag) {
            tags.add(provaTag);
        }
    }

    const extensionTag = TAG_BY_EXTENSION[extension];
    if (extensionTag) {
        tags.add(extensionTag);
    }

    if (["dsn", "pdsprj", "m"].includes(extension)) {
        tags.add("Simulação");
    }

    if (["dsn", "pdsprj"].includes(extension)) {
        tags.add("Hardware");
    }

    const professorMatch = fixMojibake(normalizedPath).match(/\d{4}[._\-\s]?[12]\s*-\s*([^/]+)/i);
    if (professorMatch) {
        const profName = professorMatch[1].trim();
        if (profName.length > 3) {
            tags.add(profName);
        }
    }

    if (upperPath.includes("N1") || /\bP1\b/.test(fileName.toUpperCase())) {
        tags.add("N1");
    }
    if (upperPath.includes("N2") || /\bP2\b/.test(fileName.toUpperCase())) {
        tags.add("N2");
    }

    if (/GABARITO/i.test(fileName) || /GABARITO/i.test(normalizedPath)) {
        tags.add("Gabarito");
    }
    if (/RESOLUCAO|RESOLUÇÃO|SOLUCAO|SOLUÇÃO/i.test(fileName) || /RESOLUCAO|RESOLUÇÃO|SOLUCAO|SOLUÇÃO/i.test(normalizedPath)) {
        tags.add("Resolução");
    }
    if (/MONITORIA/i.test(normalizedPath)) {
        tags.add("Monitoria");
    }
    if (/REVISAO|REVISAO|REVISÃO/i.test(fileName) || /REVISAO|REVISAO|REVISÃO/i.test(normalizedPath)) {
        tags.add("Revisão");
    }

    return Array.from(tags);
}
