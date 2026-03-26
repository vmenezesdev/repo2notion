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
    "idx",
    "pack",
    "rev",
]);

const SEMESTER_REGEXES = [
    /\b((?:19|20)\d{2})[._\-\s]([12])\b/,
    /\b((?:19|20)\d{2})([12])\b/,
];

const YEAR_REGEX = /\b((?:19|20)\d{2})\b/;

const DISCIPLINA_BY_SIGLA: Record<string, string> = {
    AC: "Arquitetura de Computadores",
    CA: "Cálculo",
    CALC: "Cálculo",
    CE: "Circuitos Eletrônicos",
    ED: "Eletrônica Digital",
    ELETRODIG: "Eletrônica Digital",
    GAA: "Geometria Analítica e Álgebra Linear",
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
    RCC: "Redes de Computadores",
    BD: "Banco de Dados",
    IA: "Inteligência Artificial",
    CG: "Computação Gráfica",
    ENGSOFT: "Engenharia de Software",
    ES: "Engenharia de Software",
    FE: "Física",
    GR: "Grafos",
    IP: "Introdução à Programação",
    LI: "Libras",
    PE: "Probabilidade e Estatística",
    CN: "Cálculo Numérico",
    PP: "Paradigmas de Programação",
    PSI: "Projeto de Sistemas de Informação",
    SL: "Sistemas Lineares",
    STR: "Sistemas de Tempo Real",
    PPD: "Programação Paralela e Distribuída",
    EG: "Empreendedorismo e Gestão",
    VC: "Visão Computacional",
    SE: "Sistemas Embarcados",
    EDO: "Equações Diferenciais",
    EA: "Eletrônica Analógica",
    MI: "Microcontroladores e Microprocessadores",
    GP: "Gerenciamento de Projetos",
    SM: "Sistemas Multimídia",
    PT: "Produção Textual",
    TCC: "Trabalho de Conclusão de Curso",
    BEPID: "BEPID Apple",
};

const IGNORED_SUBJECT_FOLDERS = new Set([
    "documentos",
    "puds",
    "provas",
    "listas",
    "conteudo",
    "material de apoio",
    "pics",
    "material",
    "outros",
    "..",
]);

const TIPO_PATTERNS = {
    prova: [
        /(^|\b)(p[1-4]|ap[1-4]|av[1-4]|n[1-4](?:[._-]\d+)?|af|prova|avaliac[aã]o|simulado)(\b|$)/i,
        /(^|\b)(?:av|ap|p)\s*parcial\s*\d(\b|$)/i,
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
const CODE_EXTENSIONS = new Set(["c", "h", "cpp", "java", "py", "js", "ts", "sql", "m", "asm"]);
const HARDWARE_EXTENSIONS = new Set(["dsn", "pdsprj", "pdsbak", "hex", "cof", "bdf", "bsf", "vpr", "sof", "pof"]);
const TECHNICAL_SIGLAS = new Set([
    "ED",
    "EA",
    "MI",
    "SE",
    "IAI",
    "STR",
    "RC",
    "RCC",
    "SD",
    "SM",
    "IP",
    "EDA",
    "POO",
    "PPD",
    "IA",
    "ATC",
    "BD",
    "LP",
]);

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
    pdsbak: "Proteus",
    bdf: "Quartus",
    bsf: "Quartus",
    vpr: "Quartus",
    sof: "Quartus",
    pof: "Quartus",
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
    return typeof value === "string" ? value.normalize("NFC") : "";
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
        [/Ã_/g, "í"],
        [/Ã\^/g, "ê"],
        [/Ã\?/g, "ó"],
        [/Ã\(/g, "ç"],
        [/Ã\$/g, "ú"],
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
        const match = regex.exec(text);
        if (match) {
            return `${match[1]}.${match[2]}`;
        }
    }

    const yearMatch = text.match(YEAR_REGEX);
    if (yearMatch) {
        return yearMatch[1];
    }

    return "";
}

function getSubjectPart(path: unknown): string {
    const normalizedPath = normalizePath(path);
    const parts = normalizedPath.split("/").filter(Boolean);

    const siglaNamePattern = /^\s*[A-Za-z]{2,10}\s*-\s*.+$/;
    let fallback = "";

    for (let i = parts.length - 2; i >= 0; i -= 1) {
        const part = fixMojibake(parts[i]).trim();
        if (!part) {
            continue;
        }

        const comparable = normalizeComparable(part);
        const sigla = normalizeSigla(part);
        const isIgnoredFolder =
            IGNORED_SUBJECT_FOLDERS.has(comparable) ||
            /^s\d{2}$/i.test(part) ||
            /^n\d$/i.test(part) ||
            /^\d{4}$/.test(comparable) ||
            /^\d{4}[._\-\s]?[12](?:\s*-\s*.+)?$/.test(comparable);
        if (isIgnoredFolder) {
            continue;
        }

        if (!fallback) {
            fallback = part;
        }

        if (siglaNamePattern.test(part)) {
            return part;
        }

        if (DISCIPLINA_BY_SIGLA[sigla]) {
            return part;
        }

        if (/\s-\s/.test(part) && !/^\d{4}[._\-\s]?[12]/.test(comparable)) {
            return part;
        }
    }

    return fallback;
}

function getSiglaAndName(subjectPart: string): { sigla: string; name: string } {
    if (!subjectPart) {
        return { sigla: "", name: "" };
    }

    const normalizedSubject = fixMojibake(subjectPart).trim();
    const compactSiglaMatch = normalizedSubject.match(/^\s*([A-Za-z]{2,10})\s*-\s*(.+)$/);
    if (compactSiglaMatch) {
        return {
            sigla: normalizeSigla(compactSiglaMatch[1]),
            name: compactSiglaMatch[2].trim(),
        };
    }

    const [siglaRaw, ...nameParts] = normalizedSubject.split(/\s-\s/);
    const sigla = normalizeSigla(siglaRaw ?? "");
    const name = nameParts.join(" - ").trim();

    if (!name && normalizedSubject && DISCIPLINA_BY_SIGLA[sigla]) {
        return { sigla, name: DISCIPLINA_BY_SIGLA[sigla] };
    }

    return { sigla, name };
}

function getSubjectSigla(file: RepoFile | null | undefined): string {
    const subjectPart = getSubjectPart(normalizePath(file?.path));
    const { sigla } = getSiglaAndName(subjectPart);
    return sigla;
}

function isTechnicalContext(file: RepoFile | null | undefined): boolean {
    const sigla = getSubjectSigla(file);
    return TECHNICAL_SIGLAS.has(sigla);
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

function isCodeFile(file: RepoFile | null | undefined): boolean {
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");
    return CODE_EXTENSIONS.has(extension);
}

function getAssessmentLabel(nameWithoutExt: string): string {
    const text = normalizeComparable(nameWithoutExt);

    const partialMatch = text.match(/\b(?:ap|av|p|avaliacao|prova)?\s*parcial\s*(\d)\b/i);
    if (partialMatch) {
        return `AV${partialMatch[1]}`;
    }

    const decimalGradeMatch = text.match(/\b(ap|av|p|n)\s*([1-4])(?:[._-]\s*(\d+))\b/i);
    if (decimalGradeMatch) {
        const prefix = decimalGradeMatch[1].toUpperCase();
        if (prefix === "N") {
            return `N${decimalGradeMatch[2]}.${decimalGradeMatch[3]}`;
        }
        return `AV${decimalGradeMatch[2]}.${decimalGradeMatch[3]}`;
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
export function inferMetadata(
    file: RepoFile | null | undefined,
    options?: { filterCodeFiles?: boolean }
): RecordCandidate | null {
    if (!file) {
        return null;
    }

    const normalizedFile: RepoFile = {
        ...file,
        path: normalizePath(file.path),
        name: safeString(file.name),
        extension: safeString(file.extension),
    };

    if (isNoiseFile(normalizedFile)) {
        return null;
    }

    if (options?.filterCodeFiles && isCodeFile(normalizedFile) && !isTechnicalContext(normalizedFile)) {
        return null;
    }

    const sourcePath = normalizedFile.path;

    return {
        title: normalizeTitle(normalizedFile),
        tipo: inferTipo(normalizedFile),
        disciplina: inferDisciplina(normalizedFile),
        semester: inferSemester(normalizedFile),
        tags: inferTags(normalizedFile),
        sourcePath,
    };
}

export function normalizeTitle(file: RepoFile | null | undefined): string {
    const semester = inferSemester(file);
    const subjectSigla = getSubjectSigla(file);
    const subject = inferDisciplina(file);
    const tipo = inferTipo(file);
    const originalName = safeString(file?.name);
    const nameWithoutExt = fixMojibake(originalName.replace(/\.[^/.]+$/, ""));
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");
    const isImage = IMAGE_EXTENSIONS.has(extension);

    if (/\bpud\b/i.test(nameWithoutExt) || tipo === "Plano de Ensino") {
        const pudSubject = normalizeText(nameWithoutExt)
            .replace(/^\s*(?:pud|plano\s+de\s+ensino)\b\s*[-–—:]?\s*/i, "")
            .replace(/\b(?:pdf|docx?|pptx?|xlsx?|jpe?g|png|txt|zip|rar|7z)\b/gi, "")
            .trim();
        const target = pudSubject || subject;
        return target ? `Plano de Ensino - ${target}` : "Plano de Ensino";
    }

    let cleanedName = normalizeText(nameWithoutExt)
        .replace(/^\d{5,}[-_\s]*/, "")
        .replace(/\b(?:pdf|docx?|pptx?|xlsx?|jpe?g|png|txt|zip|rar|7z)\b/gi, "")
        .replace(/^\s*(?:PUD|Plano\s+de\s+Ensino)\b\s*/gi, "")
        .replace(/^(?:\d+[)\]]\s*|\d+(?:[.\-_]\d+)+[.\-_]?\s*|\d+[.\-_]\s*)/, "")
        .replace(/[._\-]/g, " ")
        .replace(/\s*\(\s*(?:copia|copy)\s*\d*\s*\)\s*$/i, "")
        .replace(/\s+/g, " ")
        .trim();

    if (tipo === "Prova") {
        cleanedName = cleanedName.replace(/^\s*(?:prova|avaliac(?:ao|ão)|simulado)\b[:\-\s]*/i, "").trim();
    }

    if (tipo === "Lista de Exercícios") {
        cleanedName = cleanedName.replace(/^\s*(?:lista)\b[:\-\s]*/i, "").trim();
        if (/^\d+$/.test(cleanedName)) {
            cleanedName = `Lista ${cleanedName}`;
        }
    }

    const normalizedName = normalizeComparable(nameWithoutExt);
    const assessmentLabel = getAssessmentLabel(nameWithoutExt);
    const explicitPartMatch = normalizedName.match(/\b(?:parte|pt|pag(?:ina)?|p[aá]g|pg)\s*(\d+)\b/i);
    const shortPartMatch = normalizedName.match(/(?:^|[\s._-])p\s*(\d{1,3})\b/i);
    const part = explicitPartMatch?.[1] ?? (!assessmentLabel ? shortPartMatch?.[1] : "");
    const isNumericList = tipo === "Lista de Exercícios" && /^lista\s+\d+$/i.test(cleanedName);

    if (part && !isNumericList) {
        const partPattern = explicitPartMatch
            ? /\b(?:parte|pt|pag(?:ina)?|p[aá]g|pg)\s*\d+\b/gi
            : /\bp\s*\d+\b/gi;
        const baseTitle = cleanedName
            .replace(partPattern, "")
            .replace(/\s{2,}/g, " ")
            .trim();
        let finalBaseTitle = baseTitle || cleanedName;
        if (tipo === "Lista de Exercícios" && /^\d+$/.test(finalBaseTitle)) {
            finalBaseTitle = `Lista ${finalBaseTitle}`;
        }
        if (finalBaseTitle) {
            return `${finalBaseTitle} (Parte ${part})`;
        }
    }

    if (!cleanedName) {
        cleanedName = normalizeText(nameWithoutExt);
    }

    cleanedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);

    if (tipo === "Prova" && isImage) {
        const genericImageTokens = new Set([
            "prova",
            "p",
            "avaliacao",
            "av",
            "ap",
            "n1",
            "n2",
            "n3",
            "n4",
            "af",
            "final",
            "parte",
            "pt",
            "pag",
            "pagina",
            "pg",
        ]);
        const meaningfulTokens = normalizeComparable(cleanedName)
            .split(/\s+/)
            .filter(Boolean)
            .filter((token) => !genericImageTokens.has(token))
            .filter((token) => !/^\d+$/.test(token))
            .filter((token) => !/^(?:n|av|ap|p)[1-4]$/.test(token));

        if (meaningfulTokens.length > 0) {
            return cleanedName;
        }

        const gradeMatch = normalizedName.match(/\bn\s*([1-4])\b/i);
        const explicitPart = normalizedName.match(/\b(?:parte|pt|pag(?:ina)?|pg)\s*(\d+)\b/i)?.[1];
        const sequentialPart = normalizedName.match(/\bn\s*[1-4]\D+(\d+)\b/i)?.[1];
        const part = explicitPart || sequentialPart;
        const base = gradeMatch ? `Prova N${gradeMatch[1]}` : "Prova";
        if (part) {
            return `${base} (Parte ${part})`;
        }
        return base;
    }

    if (semester && assessmentLabel) {
        if (subjectSigla) {
            return `${subjectSigla} - ${assessmentLabel} - ${semester}`;
        }
        return `${assessmentLabel} - ${semester}`;
    }

    return cleanedName || normalizeText(nameWithoutExt) || originalName;
}

export function inferTipo(file: RepoFile | null | undefined): string {
    const name = normalizeComparable(file?.name);
    const path = normalizeComparable(normalizePath(file?.path));
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");
    const nameWithoutExt = fixMojibake(safeString(file?.name).replace(/\.[^/.]+$/, ""));
    const compactName = normalizeSigla(nameWithoutExt);
    const subjectSigla = getSubjectSigla(file);

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
    const isAssessmentFolder = /(^|\/)(n[1-4](?:[._-]\d+)?|av[1-4]|ap[1-4]|af)(\/|$)/i.test(path);
    const hasSemesterFolder = /(^|\/)s\d{1,2}(\/|$)/i.test(path);
    const hasAcademicSemester = /(?:19|20)\d{2}[._\-\s]?[12]/.test(path);
    const isOnlySubjectSigla = Boolean(subjectSigla) && compactName === subjectSigla;

    if (
        ["dsn", "pdsprj"].includes(extension) &&
        (isProvasFolder || isAssessmentFolder || (hasSemesterFolder && hasAcademicSemester && isOnlySubjectSigla))
    ) {
        return "Prova";
    }

    if (isPlanoDeEnsino) {
        return "Plano de Ensino";
    }

    if (isLista) {
        return "Lista de Exercícios";
    }

    if (isProva || isProvasFolder || isAssessmentFolder) {
        return "Prova";
    }

    if (
        TIPO_PATTERNS.projeto.some((pattern) => pattern.test(name) || pattern.test(path)) ||
        ["py", "c", "java", "pdsprj", "pdsbak", "dsn", "cpp", "js", "ts", "hex", "cof", "asm"].includes(extension)
    ) {
        return "Trabalho/Projeto";
    }

    if (isAula || (isMaterialFolder && !isProva)) {
        return "Material de Aula";
    }

    if (isDocumentacao && !isProva) {
        return "Documentação";
    }

    if (isResumo) {
        return "Resumo";
    }

    if (IMAGE_EXTENSIONS.has(extension)) {
        return "Material Complementar";
    }

    return "Material Complementar";
}

export function inferDisciplina(file: RepoFile | null | undefined): string {
    const path = normalizePath(file?.path);
    const parts = path.split("/").filter(Boolean);

    for (let i = parts.length - 2; i >= 0; i -= 1) {
        const part = fixMojibake(parts[i]).trim();
        if (!part) {
            continue;
        }

        const comparable = normalizeComparable(part);
        const { sigla, name } = getSiglaAndName(part);
        if (sigla && DISCIPLINA_BY_SIGLA[sigla]) {
            return DISCIPLINA_BY_SIGLA[sigla];
        }

        const isIgnored =
            IGNORED_SUBJECT_FOLDERS.has(comparable) ||
            /^documentos(?:\b|\s*[-_])/i.test(comparable) ||
            /^[sn]\d{1,2}$/i.test(comparable) ||
            /^\d{4}/.test(comparable);
        if (isIgnored) {
            continue;
        }

        if (name) {
            return fixMojibake(name).trim();
        }

        return part;
    }

    const inferredFromFileName = inferDisciplinaFromFileName(file?.name);
    if (inferredFromFileName) {
        return inferredFromFileName;
    }

    return "Geral";
}

function inferDisciplinaFromFileName(fileName: unknown): string {
    const raw = fixMojibake(safeString(fileName).replace(/\.[^/.]+$/, "")).trim();
    if (!raw) {
        return "";
    }

    const normalized = normalizeText(raw);
    const match = normalized.match(/^(?:pud|plano\s+de\s+ensino)\s*[-–—:]?\s*(.+)$/i);
    if (!match?.[1]) {
        return "";
    }

    return match[1]
        .replace(/\s*[-–—:]?\s*(?:\d{4}(?:[._\-\s]?[12])?)$/i, "")
        .replace(/\s+/g, " ")
        .trim();
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
            if (provaTag.includes(".")) {
                tags.add(provaTag.split(".")[0]);
            }
        }
    }

    const extensionTag = TAG_BY_EXTENSION[extension];
    if (extensionTag) {
        tags.add(extensionTag);
    }

    if (["dsn", "pdsprj", "m", "bdf", "bsf", "vpr", "sof", "pof"].includes(extension)) {
        tags.add("Simulação");
    }

    if (HARDWARE_EXTENSIONS.has(extension)) {
        tags.add("Hardware");
    }

    if (["dsn", "pdsprj"].includes(extension)) {
        tags.add("Projeto");
    }

    let profName = "";
    const pathParts = normalizePath(normalizedPath).split("/").filter(Boolean);

    for (let i = 0; i < pathParts.length - 1; i += 1) {
        const part = fixMojibake(pathParts[i]).trim();
        const normalizedPart = normalizeComparable(part);

        const yearDashProfessor = part.match(/^(?:19|20)\d{2}[._\-\s]?[12]\s*-\s*(.+)$/i);
        if (yearDashProfessor?.[1]) {
            const candidate = yearDashProfessor[1].trim();
            if (candidate.length >= 2 && /[A-Za-z]/.test(candidate)) {
                profName = candidate;
                break;
            }
        }

        if (/^(?:19|20)\d{2}[._\-\s]?[12]$/.test(normalizedPart) && i + 1 < pathParts.length - 1) {
            const candidate = fixMojibake(pathParts[i + 1]).trim();
            if (
                candidate.length >= 2 &&
                /[A-Za-z]/.test(candidate) &&
                !/^s\d{2}$/i.test(candidate) &&
                !/^\s*[A-Za-z]{2,10}\s*-\s*.+$/.test(candidate)
            ) {
                profName = candidate;
                break;
            }
        }
    }

    if (profName) {
        const normalizedProfessorTag = normalizeText(profName).toUpperCase();
        if (normalizedProfessorTag.length >= 2 && /[A-Z]/.test(normalizedProfessorTag)) {
            tags.add(normalizedProfessorTag);
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
