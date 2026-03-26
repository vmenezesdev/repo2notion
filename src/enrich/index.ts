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
};

const TIPO_PATTERNS = {
    prova: [
        /(^|\b)(ap\s*[1-3]?|av\s*[12]|af|p\s*[12]|prova|avaliac[aã]o|simulado)(\b|$)/i,
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
};

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
    rar: "Compactado",
    zip: "Compactado",
    "7z": "Compactado",
};

function normalizePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

function stripDiacritics(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function fixMojibake(value: string): string {
    if (!/[ÃÂ]/.test(value)) {
        return value;
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
        [/Âº/g, "º"],
        [/Âª/g, "ª"],
        [/Â°/g, "°"],
        [/Â/g, ""],
    ];

    let fixed = value;
    for (const [pattern, replacement] of replacements) {
        fixed = fixed.replace(pattern, replacement);
    }

    return fixed;
}

function normalizeText(value: string): string {
    return stripDiacritics(fixMojibake(value))
        .normalize("NFKC")
        .replace(/[_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeComparable(value: string): string {
    return normalizeText(value).toLowerCase();
}

function normalizeSigla(value: string): string {
    return normalizeComparable(value).replace(/[^a-z0-9]/g, "").toUpperCase();
}

function getSemesterFromText(value: string): string {
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

function getSubjectPart(path: string): string {
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

function isNoiseFile(file: RepoFile): boolean {
    const normalizedPath = `/${normalizeComparable(normalizePath(file.path))}/`;
    const normalizedName = normalizeComparable(file.name);
    const extension = normalizeComparable(file.extension).replace(/^\./, "");

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
    const compact = normalizeComparable(nameWithoutExt).replace(/[^a-z0-9]/g, "");

    if (/^ap[1-3]$/.test(compact)) {
        return compact.toUpperCase();
    }
    if (/^av[12]$/.test(compact)) {
        return compact.toUpperCase();
    }
    if (compact === "af") {
        return "AF";
    }
    if (/^p[12]$/.test(compact)) {
        return compact.toUpperCase();
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
export function inferMetadata(file: RepoFile): RecordCandidate | null {
    if (isNoiseFile(file)) {
        return null;
    }

    return {
        title: normalizeTitle(file),
        tipo: inferTipo(file),
        disciplina: inferDisciplina(file),
        semester: inferSemester(file),
        tags: inferTags(file),
        sourcePath: file.path,
    }
}

export function normalizeTitle(file: RepoFile): string {
    const semester = inferSemester(file);
    const nameWithoutExt = fixMojibake(file.name.replace(/\.[^/.]+$/, ""));
    const cleanedName = normalizeText(nameWithoutExt)
        .replace(/^\d{5,}[-_\s]*/, "")
        .replace(/[\-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const assessmentLabel = getAssessmentLabel(cleanedName);
    if (semester && assessmentLabel && normalizeComparable(cleanedName) === normalizeComparable(assessmentLabel)) {
        return `${assessmentLabel} - ${semester}`;
    }

    return cleanedName || normalizeText(nameWithoutExt) || file.name;
}

export function inferTipo(file: RepoFile): string {
    const name = normalizeComparable(file.name);
    const path = normalizeComparable(normalizePath(file.path));
    const extension = file.extension.toLowerCase().replace(/^\./, "");

    if (TIPO_PATTERNS.prova.some((pattern) => pattern.test(name) || pattern.test(path))) {
        return "Prova";
    }

    if (TIPO_PATTERNS.lista.some((pattern) => pattern.test(name) || pattern.test(path))) {
        return "Lista de Exercícios";
    }

    if (TIPO_PATTERNS.aula.some((pattern) => pattern.test(name) || pattern.test(path))) {
        return "Material de Aula";
    }

    if (TIPO_PATTERNS.projeto.some((pattern) => pattern.test(name) || pattern.test(path)) || ["py", "c", "java", "pdsprj", "dsn", "cpp", "js", "ts"].includes(extension)) {
        return "Trabalho/Projeto";
    }

    if (TIPO_PATTERNS.resumo.some((pattern) => pattern.test(name) || pattern.test(path))) {
        return "Resumo";
    }

    return "Material Complementar";
}

export function inferDisciplina(file: RepoFile): string {
    const subjectPart = getSubjectPart(normalizePath(file.path));
    const { sigla, name } = getSiglaAndName(subjectPart);

    if (DISCIPLINA_BY_SIGLA[sigla]) {
        return DISCIPLINA_BY_SIGLA[sigla];
    }

    if (name) {
        return fixMojibake(name);
    }

    return fixMojibake(subjectPart);
}

export function inferSemester(file: RepoFile): string {
    return getSemesterFromText(`${normalizePath(file.path)} ${file.name}`);
}

export function inferTags(file: RepoFile): string[] {
    const tags = new Set<string>();
    const normalizedPath = normalizePath(file.path);
    const subjectPart = getSubjectPart(normalizedPath);
    const { sigla } = getSiglaAndName(subjectPart);
    const semester = inferSemester(file);
    const tipo = inferTipo(file);
    const extension = file.extension.toLowerCase().replace(/^\./, "");
    const upperPath = normalizeComparable(normalizedPath).toUpperCase();

    if (sigla) {
        tags.add(sigla);
    }

    if (semester) {
        tags.add(semester);
    }

    if (tipo === "Prova") {
        const provaTag = getAssessmentLabel(file.name.replace(/\.[^/.]+$/, ""));
        if (provaTag) {
            tags.add(provaTag);
        }
    }

    const extensionTag = TAG_BY_EXTENSION[extension];
    if (extensionTag) {
        tags.add(extensionTag);
    }

    if (upperPath.includes("N1") || /\bP1\b/.test(file.name.toUpperCase())) {
        tags.add("N1");
    }
    if (upperPath.includes("N2") || /\bP2\b/.test(file.name.toUpperCase())) {
        tags.add("N2");
    }

    if (/GABARITO/i.test(file.name) || /GABARITO/i.test(normalizedPath)) {
        tags.add("Gabarito");
    }
    if (/RESOLUCAO|RESOLUÇÃO|SOLUCAO|SOLUÇÃO/i.test(file.name) || /RESOLUCAO|RESOLUÇÃO|SOLUCAO|SOLUÇÃO/i.test(normalizedPath)) {
        tags.add("Resolução");
    }
    if (/MONITORIA/i.test(normalizedPath)) {
        tags.add("Monitoria");
    }
    if (/REVISAO|REVISAO|REVISÃO/i.test(file.name) || /REVISAO|REVISAO|REVISÃO/i.test(normalizedPath)) {
        tags.add("Revisão");
    }

    return Array.from(tags);
}
