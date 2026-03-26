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
    "/obj/",
    "/bin/",
    "/.vs/",
    "/ipch/",
    "/__pycache__/",
    "/venv/",
    "/.venv/",
    "/src/images/",
    "/conteudo anterior/",
    "/conteúdo anterior/",
    "/incremental_db/",
    "/output_files/",
    "/db_info/",
];

const NOISE_FOLDER_PARTS = new Set([
    "db",
    "incremental db",
    "simulation",
    "output files",
]);

const NOISE_FILE_NAMES = new Set([
    ".ds_store",
    "thumbs.db",
    "desktop.ini",
    ".gitignore",
    ".gitattributes",
    ".editorconfig",
]);

const CONTEXT_README_FOLDERS = new Set(["src"]);

const NOISE_EXTENSIONS = new Set([
    "tmp",
    "temp",
    "bak",
    "hex",
    "cof",
    "map",
    "lst",
    "pjt",
    "sym",
    "tre",
    "ptn",
    "mem",
    "log",
    "exe",
    "jar",
    "bin",
    "info",
    "o",
    "pdsbak",
    "old",
    "orig",
    "swp",
    "lock",
    "idx",
    "pack",
    "rev",
    "cdb",
    "hdb",
    "qmsg",
    "bpm",
    "kpt",
    "sci",
    "logdb",
    "idb",
    "rdb",
    "ddb",
    "ammdb",
    "qsf",
    "qpf",
    "qws",
    "sft",
    "done",
    "rpt",
    "summary",
    "jdi",
    "pin",
    "sld",
    "workspace",
    "depend",
    "layout",
    "cbp",
    "msi",
    "db_info",
    "db info",
]);

const COMPILED_ARTIFACT_EXTENSIONS = new Set([
    "hex",
    "map",
    "o",
    "lst",
    "pdsbak",
    "cdb",
    "hdb",
    "qmsg",
    "bpm",
    "kpt",
    "sci",
    "logdb",
    "idb",
    "rdb",
    "ddb",
    "ammdb",
    "qsf",
    "qpf",
    "qws",
    "sft",
]);

const SEMESTER_REGEXES = [
    /\b((?:19|20)\d{2})[._\-\s]([12])\b/,
    /\b((?:19|20)\d{2})([12])\b/,
];

const YEAR_REGEX = /(?:^|[^A-Za-z0-9])((?:19|20)\d{2})(?!\d)(?:$|[^A-Za-z])/;

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
    MD: "Matemática Discreta",
    ATC: "Aspectos Teóricos da Computação",
    IAI: "Introdução à Automação Industrial",
    IAA: "Introdução à Análise de Algoritmos",
    IN: "Instrumentação",
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
    PO: "Pesquisa e Ordenação",
    PEO: "Pesquisa e Ordenação",
    IC: "Inteligência Computacional",
    CN: "Cálculo Numérico",
    PP: "Paradigmas de Programação",
    PSI: "Projeto de Sistemas de Informação",
    SL: "Sistemas Lineares",
    STR: "Sistemas de Tempo Real",
    PPD: "Programação Paralela e Distribuída",
    PDS: "Processamento Digital de Sinais",
    EG: "Empreendedorismo e Gestão",
    VC: "Visão Computacional",
    IHC: "Interação Humano Computador",
    PDI: "Processamento Digital de Imagens",
    SE: "Sistemas Embarcados",
    SEMBS: "Sistemas Embarcados",
    EDO: "Equações Diferenciais",
    EF: "Ética e Filosofia",
    EA: "Eletrônica Analógica",
    EI: "Eletrônica Industrial",
    MI: "Microcontroladores e Microprocessadores",
    MCT: "Metodologia Científica",
    GP: "Gerenciamento de Projetos",
    SM: "Sistemas Multimídia",
    PT: "Produção Textual",
    TGI: "Trabalho de Graduação Interdisciplinar",
    PS: "Projeto Social",
    TCC: "Trabalho de Conclusão de Curso",
    BEPID: "BEPID Apple",
};

const DISCIPLINA_BY_SIGLA_AND_SEMESTER: Record<string, Record<number, string>> = {
    ED: {
        1: "Eletrônica Digital",
        2: "Eletrônica Digital",
        3: "Estrutura de Dados",
    },
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
    "cadeiras com o ronaldo",
    "..",
]);

const TOPIC_SUBJECT_FOLDERS = new Set([
    "aula",
    "aulas",
    "exercicio",
    "exercicios",
    "exercício",
    "exercícios",
    "prova",
    "provas",
    "projeto",
    "projetos",
    "trabalho",
    "trabalhos",
    "sockets",
    "rmi",
    "corba",
    "threads",
    "arduino",
]);

const GENERIC_CONTEXT_FOLDERS = new Set([
    "src",
    "source",
    "sources",
    "include",
    "inc",
    "bin",
    "obj",
    "debug",
    "release",
    "main",
    "code",
    "codigo",
    "código",
    "projeto",
    "project",
    "projects",
    "trabalho",
    "trabalhos",
    "q1",
    "q2",
    "q3",
    "q4",
    "image",
    "images",
    "img",
    "imgs",
    "asset",
    "assets",
]);

const TIPO_PATTERNS = {
    prova: [
        /(^|\b)(p[1-4]|ap[1-4]|av[1-4]|n[1-4](?:[._-]\d+)?|af|vs|prova|avaliac[aã]o|simulado)(\b|$)/i,
        /(^|\b)(?:av|ap|p)\s*parcial\s*\d(\b|$)/i,
        /(^|\b)(exam|midterm|final\s*exam|test|quiz)(\b|$)/i,
        /(\/|\b)(provas?|avaliac(?:oes|o(?:es)?)|simulados?)(\/|\b)/i,
    ],
    lista: [
        /^\d+\s*(?:a|ª|o|º)?\s*lista(?:gem)?(?:\s*de)?/i,
        /(^|\b)(lista(?:gem)?(?:\s*de)?|exerc[ií]c(?:io|ios)?|folha\s*de\s*exerc[ií]cios?|td|exerc)(\b|$)/i,
        /(^|\b)(assignment|homework|problem\s*set)(\b|$)/i,
        /(\/|\b)(listas?|exercicios?|tutoriais?)(\/|\b)/i,
    ],
    aula: [
        /(^|\b)(aula|slides?|pud|apresentac[aã]o|material\s*de\s*apoio|apostila)(\b|$)/i,
        /(\/|\b)(aulas?|slides?|material(?:\s*de)?\s*apoio|monitoria)(\/|\b)/i,
    ],
    projeto: [
        /(^|\b)(trabalho|projeto(?:\s*final)?|semin[aá]rio|relat[oó]rio|lab(?:orat[oó]rio)?|pr[aá]tica)(\b|$)/i,
        /(\/|\b)(trabalhos?|projetos?|labs?|laboratorios?)(\/|\b)/i,
    ],
    resumo: [
        /(^|\b)(resumo|anota[cç][oõ]es?|caderno|mapa\s*mental|cola)(\b|$)/i,
    ],
    documentacao: [
        /(^|\b)(manual|guia|roteiro|aviso|ementa|cronograma|instru[cç][aã]o|documenta[cç][aã]o)(\b|$)/i,
        /(\/|\b)(documentos?|docs?|guias?|avisos?)(\/|\b)/i,
    ],
    administrativo: [
        /(^|\b)(est[aá]gio|estagio|termo\s*de\s*compromisso|ifce|coordena[cç][aã]o|declara[cç][aã]o|requerimento)(\b|$)/i,
        /(\/|\b)(est[aá]gio|estagio|administrativo|secretaria)(\/|\b)/i,
    ],
    gabaritoResolucao: [
        /(^|\b)(gabaritos?|resolu[cç][aã]o|solu[cç][aã]o|respostas?|answer\s*key|solution|resolvidos)(\b|$)/i,
    ],
};

const MATERIAL_FOLDER_PATTERN = /(\/|\b)(puds?|material(?:\s*de)?\s*apoio|monitoria)(\/|\b)/i;
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg", "heic"]);
const TEXT_EXTENSIONS = new Set(["txt", "md", "rtf", "doc", "docx", "odt"]);
const CODE_EXTENSIONS = new Set(["c", "h", "cpp", "java", "py", "js", "ts", "sql", "m", "asm", "af", "idl"]);
const HARDWARE_EXTENSIONS = new Set(["dsn", "pdsprj", "pdsbak", "pdsit", "hex", "cof", "bdf", "bsf", "vpr", "sof", "pof", "qsf", "mcp", "mcs", "mcw", "sch"]);
const HARDWARE_TAG_EXTENSIONS = new Set(["dsn", "bdf", "sch"]);
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
    "AC",
    "CG",
    "CN",
    "GAA",
]);
const NON_TECHNICAL_SIGLAS = new Set(["PT", "LI", "EF", "PS", "MCT"]);

const PROFESSOR_CANONICAL_MAP_RAW: Record<string, string> = {
    JB: "João Batista Bezerra Frota",
    "JOAO BATISTA": "João Batista Bezerra Frota",
    BENTO: "José Bento de Freitas",
    AJALMAR: "Ajalmar Rêgo da Rocha Neto",
    ANAXAGORAS: "Anaxágoras Maia Girão",
    "ANAXÁGORAS": "Anaxágoras Maia Girão",
    PARENTE: "Fernando Parente Garcia",
    GLAUBER: "Glauber Ferreira Cintra",
    CIDCLEY: "Cidcley Teixeira de Souza",
    HAIRON: "Carlos Hairon Ribeiro Gonçalves",
    "CESAR OLAVO": "Cesar Olavo de Moura Filho",
    ELIAS: "Elias Teodoro da Silva Júnior",
    NIVANDO: "Francisco Nivando Bezerra",
    ALISSON: "Alisson Gomes Linhares",
    ALLYSON: "Allyson Bonetti França",
    "RICARDO TAVEIRA": "Ricardo Duarte Taveira",
    NIDIA: "Nídia Glória da Silva Campos",
    "PAULO REGIS": "Paulo Régis Carneiro de Araújo",
    RONALDO: "Ronaldo Fernandes Ramos",
    "FERNANDO MACEDO": "Fernando Macedo",
    MACEDO: "Fernando Macedo",
    "ROBERTO CARLOS": "Roberto Carlos",
    "MARIA EUGENIA": "Maria Eugênia",
    MURILO: "Murilo",
    "HUGO VICTOR": "Hugo Victor",
    "SEBASTIAO PONTES": "Sebastião Pontes",
    "LUCAS SOUSA": "Lucas Sousa",
    "LUCAS MOURA": "Lucas Moura",
    NARCELIO: "Narcélio Pinto",
    "NARCÉLIO": "Narcélio Pinto",
    SERRA: "Serra",
    "ALUISIO CABRAL": "Aluísio Cabral",
    "JOSE CARNEIRO": "José Carneiro",
    "JOSÉ CARNEIRO": "José Carneiro",
    PH: "Paulo Henrique",
    JOACILO: "Joacilo",
    JOACILLO: "Joacilo",
    "RICARDO RODRIGES": "Ricardo Rodrigues",
    "RICARDO RODRIGUES": "Ricardo Rodrigues",
    "CARLOS WAGNER": "Carlos Wagner",
    MAURICIO: "Mauricio",
    EDMAR: "Edmar",
    "BRUNO MESQUITA": "Bruno Mesquita",
    DIJALMA: "Dijalma",
    VALBERTO: "Valberto",
    ERNANI: "Ernani Leite",
    "ERNANI LEITE": "Ernani Leite",
    ALMIR: "Almir",
    WELLINGTON: "Wellington",
    CRISTIANE: "Cristiane",
    ANDREIA: "Andréia Rodrigues",
    "ANDREIA RODRIGUES": "Andréia Rodrigues",
    "ANDRÉIA RODRIGUES": "Andréia Rodrigues",
    "PAULO DIEGO": "Paulo Diego",
};

const GENERIC_TITLE_TOKENS = new Set([
    "prova",
    "lista",
    "trabalho",
    "projeto",
    "relatorio",
    "relatório",
    "main",
    "exercicio",
    "exercício",
    "atividade",
    "arquivo",
    "documento",
    "material",
    "resumo",
    "n1",
    "n2",
    "n3",
    "n4",
    "av1",
    "av2",
    "av3",
    "av4",
    "ap1",
    "ap2",
    "ap3",
    "ap4",
    "p1",
    "p2",
    "p3",
    "p4",
]);

const PROFESSOR_CANONICAL_MAP = new Map(
    Object.entries(PROFESSOR_CANONICAL_MAP_RAW).map(([alias, canonical]) => [
        normalizeComparable(alias).toUpperCase(),
        canonical,
    ]),
);

const KNOWN_PROFESSORS = Array.from(new Set(PROFESSOR_CANONICAL_MAP.values()));

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
    idl: "IDL",
    af: "Automaton",
    m: "MATLAB",
    fig: "MATLAB",
    ipynb: "Jupyter",
    dsn: "Proteus",
    pdsprj: "Proteus",
    pdsbak: "Proteus",
    pdsit: "Proteus",
    bdf: "Quartus",
    bsf: "Quartus",
    vpr: "Quartus",
    sof: "Quartus",
    pof: "Quartus",
    mcp: "MPLAB",
    mcs: "MPLAB",
    mcw: "MPLAB",
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

const SIGLA_BY_DISCIPLINA_COMPARABLE = new Map<string, string>();

for (const [sigla, disciplina] of Object.entries(DISCIPLINA_BY_SIGLA)) {
    const comparable = normalizeComparable(disciplina);
    if (comparable && !SIGLA_BY_DISCIPLINA_COMPARABLE.has(comparable)) {
        SIGLA_BY_DISCIPLINA_COMPARABLE.set(comparable, sigla);
    }
}

for (const [sigla, bySemester] of Object.entries(DISCIPLINA_BY_SIGLA_AND_SEMESTER)) {
    for (const disciplina of Object.values(bySemester)) {
        const comparable = normalizeComparable(disciplina);
        if (comparable && !SIGLA_BY_DISCIPLINA_COMPARABLE.has(comparable)) {
            SIGLA_BY_DISCIPLINA_COMPARABLE.set(comparable, sigla);
        }
    }
}

function safeString(value: unknown): string {
    return typeof value === "string" ? value.normalize("NFC") : "";
}

const MOJIBAKE_REPLACEMENTS: Array<[RegExp, string]> = [
    [/Ã_cios/g, "ícios"],
    [/Ã_cio/g, "ício"],
    [/Ã_cias/g, "ícias"],
    [/Ã_cia/g, "ícia"],
    [/Ã§Ã£/g, "çã"],
    [/Ã£o/g, "ão"],
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
    [/Â(?=\s|$|[.,;:!?\)\]\}])/g, ""],
];

function normalizePath(path: unknown): string {
    return safeString(path).replace(/\\/g, "/").replace(/\/+/g, "/");
}

function stripDiacritics(value: unknown): string {
    return safeString(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function fixMojibake(value: unknown): string {
    const safeValue = safeString(value);

    const hasMojibakeHints =
        /Ã[\u0080-\u00BF]/.test(safeValue) ||
        /Â[\u0080-\u00BF]/.test(safeValue) ||
        /Ã[_^?($]/.test(safeValue) ||
        /�/.test(safeValue);

    if (!hasMojibakeHints) {
        return safeValue;
    }

    let fixed = safeValue;
    const maxPasses = safeValue.length > 4000 ? 1 : 3;
    for (let pass = 0; pass < maxPasses; pass += 1) {
        let next = fixed;
        for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
            next = next.replace(pattern, replacement);
        }
        if (next === fixed) {
            break;
        }
        fixed = next;
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

function splitJoinedTitleTokens(value: string): string {
    return value
    .replace(/([a-zà-ÿ]{2,})([A-ZÀ-Ý][a-zà-ÿ])/g, "$1 $2")
        .replace(/([A-ZÀ-Ý])([A-ZÀ-Ý][a-zà-ÿ])/g, "$1 $2")
        .replace(/\blistade\b/gi, "lista de")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeComparable(value: unknown): string {
    return stripDiacritics(normalizeText(value)).toLowerCase();
}

function normalizeSigla(value: unknown): string {
    return normalizeComparable(value).replace(/[^a-z0-9]/g, "").toUpperCase();
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isLikelySigla(sigla: string): boolean {
    if (!sigla) {
        return false;
    }

    if (/^(?:N|P|AP|AV)[1-4](?:\d+)?$/.test(sigla) || sigla === "AF") {
        return false;
    }

    if (DISCIPLINA_BY_SIGLA[sigla]) {
        return true;
    }

    if (DISCIPLINA_BY_SIGLA_AND_SEMESTER[sigla]) {
        return true;
    }

    if (!/^[A-Z0-9]+$/.test(sigla)) {
        return false;
    }

    if (sigla.length > 5) {
        return false;
    }

    if (/^[A-Z]{4,5}$/.test(sigla)) {
        return false;
    }

    return true;
}

function hasKnownProfessorAlias(value: unknown): boolean {
    const comparableValue = normalizeComparable(value).toUpperCase();
    if (!comparableValue) {
        return false;
    }

    for (const alias of PROFESSOR_CANONICAL_MAP.keys()) {
        if (alias.length < 3) {
            continue;
        }
        if (comparableValue === alias || comparableValue.includes(` ${alias} `) || comparableValue.endsWith(` ${alias}`)) {
            return true;
        }
    }

    return false;
}

function isLikelyProfessorFolder(part: string): boolean {
    const normalizedPart = normalizeText(part);
    if (!normalizedPart) {
        return false;
    }

    const wrappedPart = ` ${normalizedPart} `;
    if (hasKnownProfessorAlias(wrappedPart) && /\b(?:prof(?:essor)?|cadeiras?|turmas?|com)\b/i.test(normalizedPart)) {
        return true;
    }

    if (/^(?:19|20)\d{2}[._\-\s]?[12]\s*[-–—]\s*[A-Za-zÀ-ÿ]/.test(normalizedPart)) {
        return true;
    }

    if (/^(?:prof(?:essor)?\.?\s*)?[A-Za-zÀ-ÿ]{3,}(?:\s+[A-Za-zÀ-ÿ]{2,}){0,3}$/.test(normalizedPart)) {
        return hasKnownProfessorAlias(` ${normalizedPart} `);
    }

    return false;
}

function getSemesterNumberFromPath(path: unknown): number | null {
    const normalizedPath = normalizePath(path);
    const match = normalizedPath.match(/(?:^|\/)s(\d{1,2})(?:\/|$)/i);
    if (!match?.[1]) {
        return null;
    }

    const semesterNumber = Number(match[1]);
    return Number.isFinite(semesterNumber) ? semesterNumber : null;
}

function inferPathLevelToken(path: unknown, context?: string): string {
    const normalizedPath = normalizeComparable(path);
    if (!normalizedPath) {
        return "";
    }

    if (context) {
        const escapedContext = escapeRegExp(normalizeComparable(context));
        const contextualMatch = normalizedPath.match(new RegExp(`\\b${escapedContext}\\s*(?:[-–—_.]|\\s)*(i{1,3}|[123])\\b`, "i"));
        if (contextualMatch?.[1]) {
            return normalizeComparable(contextualMatch[1]);
        }
    }

    const semesterLevelMatch = normalizedPath.match(/(?:^|\/)s0*([1-3])(?:\/|$)/i);
    if (semesterLevelMatch?.[1]) {
        return semesterLevelMatch[1];
    }

    return "";
}

function levelFromToken(token: string): string {
    if (token === "1" || token === "i") {
        return "I";
    }
    if (token === "2" || token === "ii") {
        return "II";
    }
    if (token === "3" || token === "iii") {
        return "III";
    }
    return "";
}

function appendDisciplineLevel(baseDisciplina: string, path: unknown): string {
    const normalizedBase = normalizeComparable(baseDisciplina);
    if (!normalizedBase || /\b(?:i|ii|iii|[123])$/.test(normalizedBase)) {
        return baseDisciplina;
    }

    const shouldSpecialize =
        normalizedBase === "calculo" ||
        normalizedBase === "fisica" ||
        normalizedBase === "quimica";
    if (!shouldSpecialize) {
        return baseDisciplina;
    }

    const token = inferPathLevelToken(path, normalizedBase);
    const level = levelFromToken(token);
    if (!level) {
        return baseDisciplina;
    }

    return `${baseDisciplina} ${level}`;
}

function resolveDisciplinaBySigla(sigla: string, path?: unknown): string {
    if (!sigla) {
        return "";
    }

    if (sigla === "EDA") {
        return appendDisciplineLevel("Estrutura de Dados", path);
    }

    const normalizedPath = normalizeComparable(path).toUpperCase();
    const semesterNumber = getSemesterNumberFromPath(path);

    if (sigla === "CA" || sigla === "CALC") {
        const calculoLevel = inferCalculoLevelFromPath(path);
        if (calculoLevel) {
            return `Calculo ${calculoLevel}`;
        }
    }

    if (sigla === "ED") {
        if (semesterNumber === 1 || semesterNumber === 2) {
            return "Eletrônica Digital";
        }
        if (semesterNumber === 3) {
            return "Estrutura de Dados";
        }

        if (/\bESTRUTURA\b|\bDADOS\b/.test(normalizedPath)) {
            return "Estrutura de Dados";
        }
        if (/\bELETRONICA\b|\bDIGITAL\b/.test(normalizedPath)) {
            return "Eletrônica Digital";
        }

        if (/\bALISSON\b|\bALLYSON\b|\bERNANI\b|\bREBECA\b/.test(normalizedPath)) {
            return "Estrutura de Dados";
        }
    }

    if (sigla === "ED") {
        if (/\bJB\b|\bJOACIL+O\b/.test(normalizedPath)) {
            return "Eletrônica Digital";
        }
    }

    if (semesterNumber !== null) {
        const semesterMapped = DISCIPLINA_BY_SIGLA_AND_SEMESTER[sigla]?.[semesterNumber];
        if (semesterMapped) {
            return appendDisciplineLevel(semesterMapped, path);
        }
    }

    return appendDisciplineLevel(DISCIPLINA_BY_SIGLA[sigla] ?? "", path);
}

function inferCalculoLevelFromPath(path: unknown): string {
    return levelFromToken(inferPathLevelToken(path, "calculo"));
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

function getAcademicSemesterFromText(value: unknown): string {
    const text = normalizeComparable(value);

    for (const regex of SEMESTER_REGEXES) {
        const match = regex.exec(text);
        if (match) {
            return `${match[1]}.${match[2]}`;
        }
    }

    return "";
}

function getYearFromText(value: unknown): string {
    const text = normalizeComparable(value);

    const yearMatch = text.match(YEAR_REGEX);
    if (yearMatch) {
        return yearMatch[1];
    }

    return "";
}

function stripProfessorSuffixFromFolderPart(part: string): string {
    const normalizedPart = normalizeText(part);
    if (!normalizedPart) {
        return "";
    }

    const splitParts = normalizedPart
        .split(/\s*[-–—]\s*/)
        .map((value) => value.trim())
        .filter(Boolean);
    if (splitParts.length < 2) {
        return normalizedPart;
    }

    const suffix = splitParts[splitParts.length - 1] ?? "";
    const hasProfessorSuffix = hasKnownProfessorAlias(` ${suffix} `);
    if (!hasProfessorSuffix) {
        return normalizedPart;
    }

    const withoutSuffix = splitParts.slice(0, -1).join(" - ").trim();
    if (!withoutSuffix) {
        return "";
    }

    if (/^(?:19|20)\d{2}[._\-\s]?[12]$/i.test(normalizeComparable(withoutSuffix))) {
        return "";
    }

    return withoutSuffix;
}

function inferDisciplinaFromRepositoryRoot(path: unknown): string {
    const parts = normalizePath(path)
        .split("/")
        .filter(Boolean)
        .filter((part) => part !== "." && part !== "..");
    const repositoryRoot = parts[0] ?? "";
    if (!repositoryRoot) {
        return "";
    }

    const { sigla, name } = getSiglaAndName(repositoryRoot);
    if (name) {
        return normalizeText(name);
    }

    if (sigla) {
        const resolved = resolveDisciplinaBySigla(sigla, path);
        if (resolved) {
            return resolved;
        }
    }

    return "";
}

function isGarbageIdLikeName(nameWithoutExt: string): boolean {
    const normalized = normalizeText(nameWithoutExt);
    if (!normalized) {
        return false;
    }

    const comparable = normalizeComparable(normalized);
    const hasAcademicKeyword = /\b(?:prova|avaliac(?:ao|oes)|lista|listagem|exerc(?:icio|icios)|quest(?:ao|oes)|atividade|trabalho|projeto|gabarito|resoluc(?:ao|oes)|pud|plano\s+de\s+ensino|simulado|n[1-4]|av[1-4]|ap[1-4]|p[1-4])\b/.test(comparable);
    const hasKeywordWithShortNumber = /\b(?:prova|lista|listagem|quest(?:ao|oes)|exerc(?:icio|icios)|atividade|trabalho|projeto|n|av|ap|p)\s*[-_ ]?\d{1,2}\b/.test(comparable);
    const hasLongNumericPrefixWithMeaningfulTail = /^\d{5,}\s*[-_. ]\s*[a-z]/i.test(comparable) && hasAcademicKeyword;
    if (hasKeywordWithShortNumber || hasLongNumericPrefixWithMeaningfulTail) {
        return false;
    }

    if (/^[\d_\-\s]{10,}$/.test(nameWithoutExt)) {
        return true;
    }

    const compact = normalized.replace(/\s+/g, "");
    if (/^\d{10,}[a-z]?$/i.test(compact)) {
        return true;
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length >= 3 && tokens.every((token) => /^\d+[a-z]?$/i.test(token))) {
        return true;
    }

    const digitCount = (normalized.match(/\d/g) ?? []).length;
    const letterCount = (normalized.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
    return digitCount >= 10 && letterCount <= 2;
}

function getSubjectPart(path: unknown): string {
    const normalizedPath = normalizePath(path);
    const parts = normalizedPath.split("/").filter(Boolean);

    const siglaNamePattern = /^\s*[A-Za-z]{2,10}\s*[-–—_]\s*.+$/;

    for (let i = 0; i < parts.length - 2; i += 1) {
        const part = fixMojibake(parts[i]).trim();
        if (!/^s\d{1,2}$/i.test(part)) {
            continue;
        }

        const candidate = stripProfessorSuffixFromFolderPart(fixMojibake(parts[i + 1]).trim());
        if (!candidate) {
            continue;
        }

        if (siglaNamePattern.test(candidate)) {
            return candidate;
        }

        const candidateSigla = normalizeSigla(candidate);
        if (resolveDisciplinaBySigla(candidateSigla, normalizedPath)) {
            return candidate;
        }
    }

    let fallback = "";

    for (let i = parts.length - 2; i >= 0; i -= 1) {
        const part = stripProfessorSuffixFromFolderPart(fixMojibake(parts[i]).trim());
        if (!part) {
            continue;
        }

        const comparable = normalizeComparable(part);
        const sigla = normalizeSigla(part);
        const isGenericContextFolder =
            GENERIC_CONTEXT_FOLDERS.has(comparable) ||
            /^(?:trabalho|projeto|project|atividade|lista|lab)\s*\d*(?:\s*[-–—]\s*.+)?$/i.test(comparable);
        const isIgnoredFolder =
            IGNORED_SUBJECT_FOLDERS.has(comparable) ||
            TOPIC_SUBJECT_FOLDERS.has(comparable) ||
            isGenericContextFolder ||
            /^s\d{1,2}$/i.test(part) ||
            /^n\d{1,2}$/i.test(part) ||
            /^\d+$/.test(comparable) ||
            /^\d+(?:[._\-]\d+)+$/.test(comparable) ||
            /^\d{4}$/.test(comparable) ||
            /^\d{4}[._\-\s]?[12](?:\s*[-–—]\s*.+)?$/.test(comparable) ||
            isLikelyProfessorFolder(part);
        if (isIgnoredFolder) {
            continue;
        }

        if (!fallback) {
            fallback = part;
        }

        if (siglaNamePattern.test(part)) {
            return part;
        }

        if (resolveDisciplinaBySigla(sigla, normalizedPath)) {
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
    const compactSiglaMatch = normalizedSubject.match(/^\s*([A-Za-z]{2,6})\s*([-–—_])?\s*(.+)$/);
    if (compactSiglaMatch) {
        const sigla = normalizeSigla(compactSiglaMatch[1]);
        const hasSeparator = Boolean(compactSiglaMatch[2]);
        if (!hasSeparator && !DISCIPLINA_BY_SIGLA[sigla]) {
            return { sigla: "", name: "" };
        }
        return {
            sigla,
            name: compactSiglaMatch[3].trim(),
        };
    }

    const spacedSiglaMatch = normalizedSubject.match(/^\s*([A-Z]{2,10})\s+(.+)$/);
    if (spacedSiglaMatch) {
        const sigla = normalizeSigla(spacedSiglaMatch[1]);
        const looksLikeTeacherName = /^[A-Z]{6,10}$/.test(spacedSiglaMatch[1]) && !/\d/.test(spacedSiglaMatch[1]);
        if (!looksLikeTeacherName && (DISCIPLINA_BY_SIGLA[sigla] || DISCIPLINA_BY_SIGLA_AND_SEMESTER[sigla] || isLikelySigla(sigla))) {
            return {
                sigla,
                name: spacedSiglaMatch[2].trim(),
            };
        }
    }

    const [siglaRaw, ...nameParts] = normalizedSubject.split(/\s*[-–—_]\s*/);
    const sigla = normalizeSigla(siglaRaw ?? "");
    const name = nameParts.join(" - ").trim();

    if (!name && normalizedSubject && DISCIPLINA_BY_SIGLA[sigla]) {
        return { sigla, name: DISCIPLINA_BY_SIGLA[sigla] };
    }

    return { sigla, name };
}

function levenshteinDistance(a: string, b: string): number {
    if (a === b) {
        return 0;
    }
    if (!a.length) {
        return b.length;
    }
    if (!b.length) {
        return a.length;
    }

    const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    const current = new Array<number>(b.length + 1).fill(0);

    for (let i = 1; i <= a.length; i += 1) {
        current[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
            const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + substitutionCost,
            );
        }
        for (let j = 0; j <= b.length; j += 1) {
            previous[j] = current[j];
        }
    }

    return previous[b.length];
}

function normalizeProfessorName(candidate: string): string {
    const normalizedCandidate = normalizeText(candidate);
    if (!normalizedCandidate) {
        return "";
    }

    const canonical = PROFESSOR_CANONICAL_MAP.get(normalizeComparable(normalizedCandidate).toUpperCase());
    if (canonical) {
        return canonical;
    }

    const comparableCandidate = normalizeComparable(normalizedCandidate).toUpperCase();
    let bestMatch = "";
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const professor of KNOWN_PROFESSORS) {
        const comparableProfessor = normalizeComparable(professor).toUpperCase();
        if (comparableCandidate[0] && comparableProfessor[0] && comparableCandidate[0] !== comparableProfessor[0]) {
            continue;
        }
        if (Math.abs(comparableCandidate.length - comparableProfessor.length) > 4) {
            continue;
        }
        const distance = levenshteinDistance(comparableCandidate, comparableProfessor);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = professor;
        }
    }

    if (!bestMatch) {
        return normalizedCandidate.toUpperCase();
    }

    const bestLength = normalizeComparable(bestMatch).length;
    const threshold =
        bestLength <= 5
            ? 1
            : bestLength <= 8
                ? 2
                : Math.max(2, Math.min(4, Math.floor(bestLength * 0.25)));
    return bestDistance <= threshold ? bestMatch : normalizedCandidate.toUpperCase();
}

function inferProfessorFromPath(path: unknown): string {
    const pathParts = normalizePath(path).split("/").filter(Boolean);
    for (const part of pathParts) {
        const comparablePartUpper = normalizeComparable(part).toUpperCase();
        for (const [alias, canonical] of PROFESSOR_CANONICAL_MAP.entries()) {
            if (alias.length >= 3 && comparablePartUpper.includes(alias)) {
                return canonical;
            }
        }
    }
    return "";
}

function getSubjectSigla(file: RepoFile | null | undefined): string {
    const subjectPart = getSubjectPart(normalizePath(file?.path));
    const { sigla } = getSiglaAndName(subjectPart);
    if (DISCIPLINA_BY_SIGLA[sigla] || DISCIPLINA_BY_SIGLA_AND_SEMESTER[sigla] || isLikelySigla(sigla)) {
        return sigla;
    }
    return "";
}

function getPathFolderParts(path: unknown): string[] {
    const parts = normalizePath(path).split("/").filter(Boolean);
    return parts.slice(0, Math.max(0, parts.length - 1));
}

function isIgnoredContainerFolder(path: unknown): boolean {
    const folderParts = getPathFolderParts(path);
    const parent = folderParts[folderParts.length - 1] ?? "";
    return IGNORED_SUBJECT_FOLDERS.has(normalizeComparable(parent));
}

function inferGenericTitleTypeLabel(tipo: string): string {
    if (["Documentação", "Material de Aula", "Resumo"].includes(tipo)) {
        return "Material Complementar";
    }
    return tipo || "Material Complementar";
}

function inferImageTitleFromIgnoredFolderContext(file: RepoFile | null | undefined, normalizedName: string): string {
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");
    if (!IMAGE_EXTENSIONS.has(extension) || !isIgnoredContainerFolder(file?.path)) {
        return "";
    }

    const disciplina = inferDisciplina(file);
    const semester = inferSemester(file);
    const tipo = inferTipo(file);
    const isGenericCaptureName = /^(?:img|dsc|whatsapp\s+image|snapshot|photo|foto|captura|scan|imagem?)\b/.test(normalizedName);
    if (disciplina && tipo === "Prova" && isGenericCaptureName) {
        const suffix = semester ? ` - ${semester}` : "";
        return `Prova - ${disciplina}${suffix} (Imagem)`;
    }

    const questionMatch =
        normalizedName.match(/\bquest(?:a|ã)o\s*(\d+)\b/i) ??
        normalizedName.match(/\b(\d+)\s*quest(?:a|ã)o\b/i) ??
        normalizedName.match(/^(\d+)quest(?:a|ã)o$/i);
    if (questionMatch?.[1] && disciplina) {
        const suffix = semester ? ` (${semester})` : "";
        return `${disciplina} - Questão ${questionMatch[1]}${suffix}`;
    }

    if (disciplina && isGenericCaptureName) {
        const suffix = semester ? ` (${semester})` : "";
        return `${disciplina} - Imagem${suffix}`;
    }

    return "";
}

function getResolvedSiglaFromDisciplina(disciplina: string): string {
    const comparableDisciplina = normalizeComparable(disciplina);
    if (!comparableDisciplina) {
        return "";
    }

    const direct = SIGLA_BY_DISCIPLINA_COMPARABLE.get(comparableDisciplina);
    if (direct) {
        return direct;
    }

    for (const [disciplinaComparable, sigla] of SIGLA_BY_DISCIPLINA_COMPARABLE.entries()) {
        if (
            comparableDisciplina.startsWith(`${disciplinaComparable} `) ||
            disciplinaComparable.startsWith(`${comparableDisciplina} `)
        ) {
            return sigla;
        }
    }

    return "";
}

function dedupeTagsByContent(tags: string[], protectedTags: string[] = []): string[] {
    const normalizedProtected = new Set(
        protectedTags.map((tag) => normalizeComparable(tag)).filter(Boolean),
    );

    return tags.filter((tag, index, allTags) => {
        const current = normalizeComparable(tag);
        if (!current) {
            return false;
        }
        if (normalizedProtected.has(current)) {
            return true;
        }

        const hasEquivalentSigla = allTags.some((otherTag, otherIndex) => {
            if (otherIndex === index) {
                return false;
            }
            const candidateSigla = normalizeSigla(otherTag);
            if (!isLikelySigla(candidateSigla)) {
                return false;
            }
            const resolvedDisciplina = resolveDisciplinaBySigla(candidateSigla);
            if (!resolvedDisciplina) {
                return false;
            }
            const normalizedResolved = normalizeComparable(resolvedDisciplina);
            if (normalizedResolved === current) {
                return true;
            }
            if (current.length < 6) {
                return false;
            }
            return normalizedResolved.startsWith(`${current} `) || current.startsWith(`${normalizedResolved} `);
        });
        if (hasEquivalentSigla) {
            return false;
        }

        if (/^(?:av|n|ap|p)\d(?:\.\d+)?$/i.test(current) || current === "af") {
            return true;
        }
        if (current.length <= 2) {
            return true;
        }

        return !allTags.some((otherTag, otherIndex) => {
            if (otherIndex === index) {
                return false;
            }
            const other = normalizeComparable(otherTag);
            if (!other || other.length <= current.length) {
                return false;
            }
            return other.includes(current);
        });
    });
}

function isTechnicalContext(file: RepoFile | null | undefined): boolean {
    const sigla = getSubjectSigla(file);
    if (!sigla) {
        return false;
    }
    if (TECHNICAL_SIGLAS.has(sigla)) {
        return true;
    }
    if (DISCIPLINA_BY_SIGLA[sigla]) {
        return !NON_TECHNICAL_SIGLAS.has(sigla);
    }
    return false;
}

function isNoiseFile(file: RepoFile | null | undefined): boolean {
    const normalizedPath = `/${normalizeComparable(normalizePath(file?.path))}/`;
    const normalizedPathParts = normalizePath(file?.path)
        .split("/")
        .filter(Boolean)
        .map((part) => normalizeComparable(part));
    const normalizedName = normalizeComparable(file?.name);
    const normalizedStem = normalizeComparable(safeString(file?.name).replace(/\.[^/.]+$/, ""));
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");

    const isReadme = normalizedName === "readme.md" || normalizedStem === "readme";
    if (isReadme) {
        const folderParts = normalizedPathParts.slice(0, Math.max(0, normalizedPathParts.length - 1));
        const atRepoRoot = folderParts.length <= 1;
        const underContextFolder = folderParts.some((part) => CONTEXT_README_FOLDERS.has(part));
        if (atRepoRoot || underContextFolder) {
            return true;
        }
    }

    if (NOISE_PATH_MARKERS.some((marker) => normalizedPath.includes(marker))) {
        return true;
    }

    const hasSrcImagesTrail = normalizedPathParts.some((part, index) => part === "src" && normalizedPathParts[index + 1] === "images");
    const hasSemesterFolder = normalizedPathParts.some((part) => /^s\d{1,2}$/i.test(part));
    if (hasSrcImagesTrail && !hasSemesterFolder && inferDisciplina(file) === "Geral") {
        return true;
    }

    if (normalizedPath.includes("/src/") && inferDisciplina(file) === "Geral") {
        return true;
    }

    if (normalizedPathParts.some((part) => NOISE_FOLDER_PARTS.has(part))) {
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

    const provaNumberMatch = text.match(/\b(?:prova|simulado)\s*[-_ ]?(\d)\b/i);
    if (provaNumberMatch?.[1]) {
        return `AV${provaNumberMatch[1]}`;
    }

    if (text.includes("final") || /\baf\b/i.test(text)) {
        return "AF";
    }

    const vsMatch = text.match(/\bvs\s*0*([1-4])\b/i);
    if (vsMatch?.[1]) {
        return `VS${vsMatch[1]}`;
    }

    if (/\bvs\b/i.test(text)) {
        return "VS";
    }

    return "";
}

function getRetakeLabel(value: unknown): string {
    const text = normalizeComparable(value);
    if (!text) {
        return "";
    }

    if (/(?:^|\b)(?:2\s*(?:a|ª)?\s*chamad[ao]|2chamad[ao]|segunda\s+chamad[ao]|substitutiv[ao])(?:\b|$)/i.test(text)) {
        if (/substitutiv[ao]/i.test(text)) {
            return "Substitutiva";
        }
        return "2ª Chamada";
    }

    return "";
}

function getRetakeLabelFromFile(file: RepoFile | null | undefined): string {
    return getRetakeLabel(file?.name) || getRetakeLabel(file?.path);
}

function shouldUseSequentialImagePart(nameWithoutExt: string, sequencePart: string): boolean {
    if (!sequencePart) {
        return false;
    }

    const numericTokens = (nameWithoutExt.match(/\d+/g) ?? []).map((token) => String(Number(token)));
    const hasScannerLikeSequence = /(?:\d+[ _-]){2,}\d+$/.test(nameWithoutExt);
    const hasThreeOrMoreNumericTokens = numericTokens.length >= 3;
    const appearsEarlier = numericTokens.slice(0, -1).includes(sequencePart);

    if (hasThreeOrMoreNumericTokens && (appearsEarlier || hasScannerLikeSequence)) {
        return false;
    }

    return true;
}

function normalizePartLabel(part: string): string {
    const normalized = String(Number(part));
    if (/^\d+$/.test(normalized)) {
        return normalized.padStart(2, "0");
    }
    return part;
}

function stripSubjectFromGenericTitle(title: string, subject: string): string {
    if (!title || !subject) {
        return title;
    }

    const normalizedTitle = normalizeComparable(title);
    const normalizedSubject = normalizeComparable(subject);
    const startsWithGenericLead = /^(?:anotac(?:ao|oes)|anota[cç][oõ]es|resumo|material|apostila|roteiro|slides?)\b/.test(normalizedTitle);

    if (!startsWithGenericLead || !normalizedTitle.includes(normalizedSubject)) {
        return title;
    }

    const subjectPattern = new RegExp(`\\b${escapeRegExp(subject)}\\b`, "i");
    const stripped = title
        .replace(subjectPattern, " ")
        .replace(/\s*[-–—:]\s*/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

    return stripped || title;
}

function stripDanglingPrepositions(title: string): string {
    return normalizeText(title)
        .replace(/(?:\s+|[-–—:]\s*)(?:com|de|do|da|dos|das|para|por|em|na|no|nas|nos)$/i, "")
        .trim();
}

function isLikelyUnmappedProfessorName(candidate: string): boolean {
    const normalized = normalizeText(candidate);
    if (!normalized) {
        return false;
    }

    const comparable = normalizeComparable(normalized).toUpperCase();
    if (PROFESSOR_CANONICAL_MAP.has(comparable)) {
        return false;
    }

    return /^[A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+){1,3}$/.test(normalized);
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

    const extension = normalizeComparable(normalizedFile.extension).replace(/^\./, "");
    const tipo = inferTipo(normalizedFile);
    const disciplina = inferDisciplina(normalizedFile);
    const shouldFilterCodeFiles = options?.filterCodeFiles ?? true;
    if (shouldFilterCodeFiles && COMPILED_ARTIFACT_EXTENSIONS.has(extension)) {
        const shouldKeepCompiledByContext = HARDWARE_EXTENSIONS.has(extension) && ["Prova", "Trabalho/Projeto"].includes(tipo);
        if (!shouldKeepCompiledByContext) {
            return null;
        }
    }

    const normalizedPath = normalizeComparable(normalizedFile.path);
    const normalizedName = normalizeComparable(normalizedFile.name);
    const hasProjetoOuTrabalhoHint =
        /\b(?:projeto|project|trabalho|atividade|lab(?:orat[oó]rio)?)\b/.test(normalizedPath) ||
        /\b(?:projeto|project|trabalho|atividade|lab(?:orat[oó]rio)?)\b/.test(normalizedName);
    const isProfessorScopedContext = /^outros\s*-\s*prof\./i.test(normalizeComparable(disciplina));

    if (
        shouldFilterCodeFiles &&
        isCodeFile(normalizedFile) &&
        !isTechnicalContext(normalizedFile) &&
        !hasProjetoOuTrabalhoHint &&
        !isProfessorScopedContext
    ) {
        return null;
    }

    const sourcePath = normalizedFile.path;

    return {
        title: normalizeTitle(normalizedFile),
        tipo,
        disciplina,
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
    const retakeLabel = getRetakeLabelFromFile(file);

    if (/\bpud\b/i.test(nameWithoutExt) || tipo === "Plano de Ensino") {
        const pudSubject = normalizeText(nameWithoutExt)
            .replace(/^\d{5,}\s*[-–—]?\s*/i, "")
            .replace(/^\s*(?:pud|plano\s+de\s+ensino)\b\s*[-–—:]?\s*/i, "")
            .replace(/\b(?:o\s+)?pud\b/gi, "")
            .replace(/\bplano\s+de\s+ensino\b/gi, "")
            .replace(/\b(?:pdf|docx?|pptx?|xlsx?|jpe?g|png|txt|zip|rar|7z)\b/gi, "")
            .replace(/\s{2,}/g, " ")
            .trim();
        const target = pudSubject || subject;
        const pudSigla = subjectSigla || getResolvedSiglaFromDisciplina(target);
        const normalizedTarget = normalizeComparable(target);
        const isCalculoPud = pudSigla === "CA" && normalizedTarget.startsWith("calculo");
        if (isCalculoPud && target) {
            return `${normalizeText(target)} - Plano de Ensino`;
        }
        if (pudSigla) {
            return `${pudSigla} - Plano de Ensino`;
        }
        return target ? `Plano de Ensino - ${target}` : "Plano de Ensino";
    }

    let cleanedName = normalizeText(nameWithoutExt)
        .replace(/^\d{5,}(?:\s*[-–—_.]\s*\d+)?\s*[-–—_.]*\s*(?=[A-Za-zÀ-ÿ])/i, "")
        .replace(/^\d{5,}[._\-\s]*/, "")
        .replace(/\b\d{7,}\b/g, "")
        .replace(/^\d{5,}(?=[A-Za-z])/, "")
        .replace(/^(?:\d+\s*[-–—]\s*)/, "")
        .replace(/\b(?:pdf|docx?|pptx?|xlsx?|jpe?g|png|txt|zip|rar|7z)\b/gi, "")
        .replace(/^\s*(?:PUD|Plano\s+de\s+Ensino)\b\s*/gi, "")
        .replace(/^(?!(?:19|20)\d{2}(?:\b|[.\-_]))(?:\d+[)\]]\s*|\d+(?:[.\-_]\d+)+[.\-_]?\s*|\d+[.\-_]\s*|\d+\s+)/, "")
        .replace(/[._\-]/g, " ")
        .replace(/\[\s*\]/g, " ")
        .replace(/(?:^|\s)(?:c[^\s]*pia\s+de|c[^\s]*pia)\s*(?:\(?\s*\d+\s*\)?)?/gi, " ")
        .replace(/\b(?:vers[aã]o\s*)?v\d+(?:\.\d+)?\b/gi, " ")
        .replace(/\bfinal\b/gi, " ")
        .replace(/\beditad[oa]\b/gi, " ")
        .replace(/\[\s*\]/g, " ")
        .replace(/\(\s*\)/g, " ")
        .replace(/\s*\(\s*(?:copia|copy)\s*\d*\s*\)\s*$/i, "")
        .replace(/^\s*\d+\s*[-–—_]\s*(?=\d+\s*(?:a|ª|o|º)?\s*lista\b)/i, "")
        .replace(/\s*[-–—_]\s*$/, "")
        .replace(/\s+/g, " ")
        .trim();

    cleanedName = splitJoinedTitleTokens(cleanedName);

    const shouldUseGarbageFallback = isGarbageIdLikeName(nameWithoutExt) || isGarbageIdLikeName(cleanedName);
    if (shouldUseGarbageFallback) {
        cleanedName = "";
    }

    const normalizedOriginalName = normalizeComparable(nameWithoutExt);
    const hasGabaritoHint = /\b(gabarito|answer\s*key|respostas?)\b/i.test(normalizedOriginalName);
    const hasResolucaoHint = /\b(resolu[cç][aã]o|solu[cç][aã]o|resolvidos|solution)\b/i.test(normalizedOriginalName);
    const hasToolResolutionHint = /\b(wolfram(?:\s*alpha)?|symbolab|photomath|mathway)\b/i.test(normalizedOriginalName);
    const shouldPreferResolucao = hasToolResolutionHint || hasResolucaoHint;
    const resolutionPrefix = tipo === "Gabarito/Resolução"
        ? shouldPreferResolucao
            ? "Resolução"
            : "Gabarito"
        : hasGabaritoHint && !hasToolResolutionHint
            ? "Gabarito"
            : shouldPreferResolucao
                ? "Resolução"
                : "";

    if (resolutionPrefix) {
        cleanedName = cleanedName
            .replace(/\b(gabarito|resolu[cç][aã]o|solu[cç][aã]o|respostas?|answer\s*key|solution|resolvidos)\b/gi, " ")
            .replace(/\s{2,}/g, " ")
            .trim();
        cleanedName = stripDanglingPrepositions(cleanedName);
    }

    const comparableCleanedName = normalizeComparable(cleanedName);
    if (/^copia(?:\s+de)?\b/.test(comparableCleanedName)) {
        cleanedName = cleanedName
            .replace(/^\s*\S+\s+de\s+/i, "")
            .replace(/^\s*\S+\s+/i, "")
            .trim();
    }

    if (tipo === "Prova") {
        cleanedName = cleanedName
            .replace(/^\s*(?:c[^\s]*pia\s+de\s*)+/i, "")
            .replace(/^\s*(?:c[^\s]*pia\s*)+/i, "")
            .replace(/\b(?:vers[aã]o\s*)?v\d+(?:\.\d+)?\b/gi, "")
            .replace(/\b(?:editad[oa]|final)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        const provaNumberMatch =
            cleanedName.match(/\b(?:prova|avaliac(?:ao|ão)|av|ap|p)\s*[-:_]?\s*([1-4])\b/i) ||
            normalizeText(nameWithoutExt).match(/\b(?:prova|avaliac(?:ao|ão)|av|ap|p)\s*[-:_]?\s*([1-4])\b/i);
        if (provaNumberMatch?.[1] && !/\bn\s*[1-4]\b/i.test(cleanedName)) {
            cleanedName = `Prova ${provaNumberMatch[1]}`;
        }

        const numberedProvaMatch = cleanedName.match(/^\s*prova\s*[-_ ]?(\d+)\s*$/i);
        if (numberedProvaMatch?.[1]) {
            cleanedName = `Prova ${numberedProvaMatch[1]}`;
        }
        cleanedName = cleanedName.replace(/^\s*(?:prova|avaliac(?:ao|ão)|simulado)\b[:\-\s]*/i, "").trim();
        if (/^\d+$/.test(cleanedName)) {
            cleanedName = `Prova ${cleanedName}`;
        }
    }

    if (tipo === "Lista de Exercícios") {
        const listMarkerMatch = cleanedName.match(
            /^\s*(?:(\d+)\s*(?:a|ª|o|º)?\s*(?:lista(?:gem)?(?:\s*de)?)|(?:lista(?:gem)?(?:\s*de)?)\s*(\d+))\b[:\-\s]*/i,
        );
        const listNumber = listMarkerMatch?.[1] || listMarkerMatch?.[2] || "";
        if (listMarkerMatch?.[0]) {
            cleanedName = cleanedName.slice(listMarkerMatch[0].length).replace(/^[-–—:]+\s*/, "").trim();
        } else {
            cleanedName = cleanedName.replace(/^\s*(?:lista(?:gem)?(?:\s*de)?)\b[:\-\s]*/i, "").trim();
        }

        if (listNumber) {
            cleanedName = cleanedName ? `Lista ${listNumber} - ${cleanedName}` : `Lista ${listNumber}`;
        } else if (/^\d+$/.test(cleanedName)) {
            cleanedName = `Lista ${cleanedName}`;
        }
    }

    const normalizedName = normalizeComparable(nameWithoutExt);
    const assessmentLabel = getAssessmentLabel(nameWithoutExt);
    const explicitPartMatch = normalizedName.match(/\b(?:parte|pt|pag(?:ina)?|p[aá]g|pg)\s*(\d+)\b/i);
    const shortPartMatch = normalizedName.match(/(?:^|[\s._-])p\s*(\d{1,3})\b/i);
    const isTimestampPattern =
        /\b(?:19|20)\d{2}[._-]\d{2}[._-]\d{2}(?:[t\s_-]?\d{2}[._:-]\d{2}(?:[._:-]\d{2})?)?\b/i.test(normalizedName) ||
        /\b(?:19|20)\d{6}(?:[_-]?\d{6})?\b/i.test(normalizedName);
    const isCameraLikeImageName = /^(?:img|dsc|photo|whatsapp|screenshot|snapshot|scan|captura|pxl)[._\-\s]?\d+/i.test(
        nameWithoutExt,
    );
    const sequentialSuffixMatch = isImage && !isTimestampPattern && !isCameraLikeImageName
        ? nameWithoutExt.match(/[\-_ ](\d{1,3})$/)
        : null;
    const sequencePart = sequentialSuffixMatch?.[1] ? String(Number(sequentialSuffixMatch[1])) : "";
    const safeSequencePart = shouldUseSequentialImagePart(nameWithoutExt, sequencePart) ? sequencePart : "";
    const part = explicitPartMatch?.[1] || (!assessmentLabel ? shortPartMatch?.[1] || "" : "") || safeSequencePart;
    const isNumericList = tipo === "Lista de Exercícios" && /^lista\s+\d+$/i.test(cleanedName);
    const usesSequenceOnlyPart = Boolean(safeSequencePart && part === safeSequencePart && !explicitPartMatch && !shortPartMatch?.[1]);

    if (part && !isNumericList) {
        const partPattern = explicitPartMatch
            ? /\b(?:parte|pt|pag(?:ina)?|p[aá]g|pg)\s*\d+\b/gi
            : /\bp\s*\d+\b/gi;
        const baseTitle = (usesSequenceOnlyPart
            ? cleanedName.replace(/\s+0*\d{1,3}\s*$/, "")
            : cleanedName.replace(partPattern, ""))
            .replace(/\s{2,}/g, " ")
            .trim();
        let finalBaseTitle = baseTitle || cleanedName;
        finalBaseTitle = finalBaseTitle.replace(/\s*[-–—:]\s*$/, "").trim();
        if (tipo === "Prova") {
            const reversedNMatch = normalizeComparable(finalBaseTitle).match(/^n\s*(\d+)\s+prova$/i);
            if (reversedNMatch?.[1]) {
                finalBaseTitle = `Prova N${reversedNMatch[1]}`;
            }
        }
        if (tipo === "Lista de Exercícios" && /^\d+$/.test(finalBaseTitle)) {
            finalBaseTitle = `Lista ${finalBaseTitle}`;
        }
        const shouldUseContextForShortImageSequence =
            isImage &&
            safeSequencePart &&
            part === safeSequencePart &&
            usesSequenceOnlyPart &&
            finalBaseTitle.length < 10 &&
            /^(?:vs?\d*|prova|n\d+|av\d+|ap\d+|p\d+)$/i.test(normalizeComparable(finalBaseTitle));
        if (shouldUseContextForShortImageSequence) {
            const contextTitle = subject || subjectSigla || finalBaseTitle;
            if (tipo === "Prova") {
                return `Prova - ${contextTitle} (Parte ${safeSequencePart.padStart(2, "0")})`;
            }
            return `${contextTitle} - Parte ${safeSequencePart.padStart(2, "0")}`;
        }
        if (finalBaseTitle) {
            return `${finalBaseTitle} (Parte ${normalizePartLabel(part)})`;
        }
    }

    cleanedName = stripSubjectFromGenericTitle(cleanedName, subject);

    if (!cleanedName && !resolutionPrefix) {
        cleanedName = normalizeText(nameWithoutExt);
    }

    if (tipo === "Material de Aula" || tipo === "Documentação") {
        cleanedName = cleanedName.replace(/^\s*(?:prova|avaliac(?:ao|ão))\b\s*[-–—:]?\s*/i, "").trim();
    }

    if (resolutionPrefix) {
        if (!cleanedName || /^\d+$/.test(cleanedName)) {
            const listNumberFromOriginal =
                normalizedOriginalName.match(/\blista\s*(\d+)\b/i)?.[1] ||
                normalizedOriginalName.match(/^\s*(\d+)\b/)?.[1] ||
                "";
            if (cleanedName) {
                cleanedName = `Lista ${cleanedName}`;
            } else if (listNumberFromOriginal) {
                cleanedName = `Lista ${listNumberFromOriginal}`;
            } else {
                cleanedName = "Material";
            }
        }
        cleanedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
        cleanedName = `${resolutionPrefix} - ${cleanedName}`;
    }

    if (/^\d{4}\.[12]$/.test(semester)) {
        const [, year, term] = semester.match(/^(\d{4})\.([12])$/) ?? [];
        if (year && term) {
            const semesterPattern = new RegExp(`\\b${year}\\s*[._\\-/]?\\s*${term}\\b`, "gi");
            const compactPattern = new RegExp(`\\b${year}${term}\\b`, "gi");
            cleanedName = cleanedName
                .replace(semesterPattern, " ")
                .replace(compactPattern, " ")
                .replace(/\s{2,}/g, " ")
                .trim();
        }
    }

    const ignoredFolderImageTitle = inferImageTitleFromIgnoredFolderContext(file, normalizedName);
    if (ignoredFolderImageTitle) {
        return ignoredFolderImageTitle;
    }

    if (shouldUseGarbageFallback) {
        const displaySubject = subject && subject !== "Geral" ? subject : subjectSigla;
        const contextualTipo = inferGenericTitleTypeLabel(tipo);
        if (displaySubject) {
            const semesterSuffix = semester ? ` (${semester})` : "";
            return `${displaySubject} - ${contextualTipo}${semesterSuffix}`;
        }
        if (semester) {
            return `${contextualTipo} (${semester})`;
        }
        return contextualTipo;
    }

    cleanedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);

    if (tipo === "Prova") {
        const normalizedBackupLikeName = normalizeComparable(cleanedName);
        if (/\b(?:copia|copy|editado|editada|v\d+(?:\.\d+)?)\b/.test(normalizedBackupLikeName)) {
            cleanedName = "Prova";
        }
    }

    if (tipo === "Prova" && isImage) {
        const isGenericCaptureName = /^(?:img|dsc|whatsapp\s+image|snapshot|photo|foto|captura|scan|imagem?)\b/.test(normalizedName);
        if (isGenericCaptureName) {
            const contextual = [subject && subject !== "Geral" ? subject : subjectSigla, semester].filter(Boolean).join(" - ");
            if (contextual) {
                return `Prova - ${contextual} (Imagem)`;
            }
            return "Prova (Imagem)";
        }

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
        const provaNumberMatch = normalizedName.match(/\b(?:prova|avaliacao|av|ap|p)\s*([1-9]\d?)\b/i);
        const explicitPart = normalizedName.match(/\b(?:parte|pt|pag(?:ina)?|pg)\s*(\d+)\b/i)?.[1];
        const sequentialPart = normalizedName.match(/\bn\s*[1-4]\D+(\d+)\b/i)?.[1];
        const part = explicitPart || sequentialPart;
        const base = gradeMatch ? `Prova N${gradeMatch[1]}` : provaNumberMatch?.[1] ? `Prova ${provaNumberMatch[1]}` : "Prova";
        const baseWithRetake = retakeLabel ? `${base} (${retakeLabel})` : base;
        if (part) {
            return `${baseWithRetake} (Parte ${normalizePartLabel(part)})`;
        }
        if (base === "Prova") {
            const displaySubject = subject && subject !== "Geral" ? subject : subjectSigla;
            const contextualParts = [displaySubject, "Prova", semester].filter(Boolean);
            if (contextualParts.length > 1) {
                return contextualParts.join(" - ");
            }
        }
        return baseWithRetake;
    }

    if (semester && assessmentLabel) {
        const assessmentWithRetake = retakeLabel ? `${assessmentLabel} (${retakeLabel})` : assessmentLabel;
        if (subjectSigla) {
            return `${subjectSigla} - ${assessmentWithRetake} - ${semester}`;
        }
        return `${assessmentWithRetake} - ${semester}`;
    }

    const normalizedCleanedName = normalizeComparable(cleanedName);
    const isGenericAssessmentName =
        tipo === "Prova" && /^(?:prova(?:\s+\d+)?|n\s*[1-4]|(?:av|ap|p)\s*[1-4])$/i.test(normalizedCleanedName);
    const displaySubject = subject && subject !== "Geral" ? subject : subjectSigla;
    const professor = inferProfessorFromPath(file?.path);

    if (
        displaySubject &&
        (isGenericAssessmentName ||
            (normalizedCleanedName !== "main" && isGenericTitleLike(normalizedCleanedName) && originalName.length < 10))
    ) {
        const contextualTitle = cleanedName || inferGenericTitleTypeLabel(tipo);
        return [displaySubject, contextualTitle, semester].filter(Boolean).join(" - ");
    }

    if (normalizedCleanedName && subject && normalizedCleanedName === normalizeComparable(subject)) {
        if (["Material de Aula", "Documentação", "Material Complementar", "Resumo"].includes(tipo)) {
            return `${subject} - Material Principal`;
        }
        return subject;
    }
    const isGenericTitle =
        GENERIC_TITLE_TOKENS.has(normalizedCleanedName) ||
        cleanedName.length <= 2 ||
        /^\d+$/.test(cleanedName) ||
        /^(?:n|av|ap|p)[1-4]$/i.test(cleanedName);

    if (isGenericTitle) {
        if (normalizedCleanedName === "main" && (subjectSigla || semester)) {
            const contextualParts = [subjectSigla, cleanedName, semester].filter(Boolean);
            if (contextualParts.length > 1) {
                return contextualParts.join(" - ");
            }
        }

        const contextualLabel = inferGenericTitleTypeLabel(tipo);
        if (displaySubject) {
            return `${displaySubject} - ${contextualLabel}`;
        }
        if (subjectSigla || semester) {
            const contextualParts = [subjectSigla, contextualLabel, semester].filter(Boolean);
            if (contextualParts.length > 1) {
                return contextualParts.join(" - ");
            }
        }
        if (!displaySubject && professor) {
            return `Material - Prof. ${professor.split(/\s+/)[0]}`;
        }
    }

    return cleanedName || normalizeText(nameWithoutExt) || originalName;
}

export function inferTipo(file: RepoFile | null | undefined): string {
    let name = normalizeComparable(safeString(file?.name).replace(/\.[^/.]+$/, ""));
    name = name
        .replace(/(\d+\s*(?:a|ª|o|º)?)listade/gi, "$1 lista de")
        .replace(/listade/gi, "lista de");
    const normalizedPath = normalizePath(file?.path);
    const path = normalizeComparable(normalizedPath);
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");
    const pathParts = normalizedPath
        .split("/")
        .filter(Boolean)
        .filter((part) => part !== "." && part !== "..");
    const nestedParts = pathParts.slice(1, -1);
    const contextualPath = normalizeComparable(`/${nestedParts.join("/")}/`);

    const isAula = TIPO_PATTERNS.aula.some((pattern) => pattern.test(name) || pattern.test(contextualPath));
    const isLista = TIPO_PATTERNS.lista.some((pattern) => pattern.test(name) || pattern.test(contextualPath));
    const isResumo = TIPO_PATTERNS.resumo.some((pattern) => pattern.test(name) || pattern.test(contextualPath));
    const isProva = TIPO_PATTERNS.prova.some((pattern) => pattern.test(name) || pattern.test(contextualPath));
    const isDocumentacao =
        TIPO_PATTERNS.documentacao.some((pattern) => pattern.test(name) || pattern.test(contextualPath)) ||
        TEXT_EXTENSIONS.has(extension);
    const isAdministrative = TIPO_PATTERNS.administrativo.some((pattern) => pattern.test(name) || pattern.test(contextualPath));
    const isGabaritoResolucao = TIPO_PATTERNS.gabaritoResolucao.some((pattern) => pattern.test(name) || pattern.test(contextualPath));
    const isMaterialFolder = MATERIAL_FOLDER_PATTERN.test(contextualPath);
    const isPlanoDeEnsino = /\bpud\b/i.test(name) || /\bpud\b/i.test(path) || /(^|\/)puds?(\/|$)/i.test(path);
    const isRootProvasFolder = /^provas?(?:\b|\s|$)/i.test(normalizeComparable(pathParts[0] ?? ""));
    const isProvasFolder = nestedParts.some((part) => /^provas?(?:\b|\s|$)/i.test(normalizeComparable(part)));
    const isExplicitAulaFolder = nestedParts.some((part) =>
        /^(?:aulas?|material(?:\s*de)?\s*apoio|material|slides?)(?:\b|\s|$)/i.test(normalizeComparable(part)),
    );
    const isAssessmentFolder = /(^|\/)(n[1-4](?:[._-]\d+)?|av[1-4]|ap[1-4]|af)(\/|$)/i.test(contextualPath);
    const parentFolder = normalizeComparable(pathParts[pathParts.length - 2] ?? "");
    const isAssessmentParentFolder = /^(?:provas?|n[1-4](?:[._-]\d+)?|av[1-4]|ap[1-4]|p[1-4]|af)$/.test(parentFolder);
    const isHardwareFile = HARDWARE_EXTENSIONS.has(extension);
    const hasSemesterFolder = /(^|\/)s\d{1,2}(\/|$)/i.test(path);
    const hasAcademicSemester = /(?:19|20)\d{2}[._\-\s]?[12]/.test(path);
    const isAssessmentAncestorFolder = nestedParts.some((part) =>
        /^(?:provas?|n[1-4](?:[._-]\d+)?|av[1-4]|ap[1-4]|p[1-4]|af)$/i.test(normalizeComparable(part)),
    );
    const hasProjetoHint = /\bprojet(?:o|os)\b/i.test(name) || /\bprojet(?:o|os)\b/i.test(contextualPath);

    if (["dsn", "pdsprj", "pdsit"].includes(extension) && (isProvasFolder || isRootProvasFolder)) {
        return "Prova";
    }

    if (isPlanoDeEnsino) {
        return "Plano de Ensino";
    }

    if (isGabaritoResolucao) {
        return "Gabarito/Resolução";
    }

    if (isLista) {
        return "Lista de Exercícios";
    }

    if (isAdministrative) {
        return "Administrativo/Estágio";
    }

    if (extension === "m" && !hasProjetoHint) {
        return "Script/Simulação";
    }

    if (extension === "py" && isTechnicalContext(file) && !hasProjetoHint) {
        return "Script/Simulação";
    }

    if (
        (isAula || isMaterialFolder || isExplicitAulaFolder) &&
        !isProva &&
        !isProvasFolder &&
        !isAssessmentFolder &&
        !isAssessmentParentFolder &&
        !isAssessmentAncestorFolder
    ) {
        return "Material de Aula";
    }

    if (isHardwareFile && !isRootProvasFolder && !isProvasFolder) {
        return "Trabalho/Projeto";
    }

    if (
        isRootProvasFolder &&
        IMAGE_EXTENSIONS.has(extension) &&
        hasSemesterFolder &&
        hasAcademicSemester &&
        !isAula &&
        !isMaterialFolder &&
        !isExplicitAulaFolder
    ) {
        return "Prova";
    }

    if (IMAGE_EXTENSIONS.has(extension) && isAssessmentParentFolder) {
        return "Prova";
    }

    if (IMAGE_EXTENSIONS.has(extension) && isAssessmentAncestorFolder) {
        return "Prova";
    }

    if (isProva || isProvasFolder || isAssessmentFolder) {
        return "Prova";
    }

    if (IMAGE_EXTENSIONS.has(extension) && isAula && !isAssessmentFolder && !isAssessmentParentFolder) {
        return "Material de Aula";
    }

    if (["dsn", "pdsprj", "pdsit", "m"].includes(extension) && isAula) {
        return "Material de Aula";
    }

    if (
        TIPO_PATTERNS.projeto.some((pattern) => pattern.test(name) || pattern.test(contextualPath)) ||
        ["py", "c", "java", "pdsprj", "pdsbak", "pdsit", "dsn", "cpp", "js", "ts", "hex", "cof", "asm", "af", "idl", "mcp", "mcs", "mcw"].includes(extension)
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
        if (hasAcademicSemester) {
            return "Prova";
        }
        return "Material Complementar";
    }

    return "Material Complementar";
}

function isGenericTitleLike(normalizedTitle: string): boolean {
    return (
        GENERIC_TITLE_TOKENS.has(normalizedTitle) ||
        /^\d+$/.test(normalizedTitle) ||
        /^(?:n|av|ap|p)\s*[1-4]$/.test(normalizedTitle) ||
        /^prova(?:\s+\d+)?$/.test(normalizedTitle)
    );
}

function inferRonaldoDisciplineByContext(file: RepoFile | null | undefined): string {
    const context = `${normalizeComparable(file?.path)} ${normalizeComparable(file?.name)}`;
    if (!context.includes("ronaldo")) {
        return "";
    }

    if (/\b(sort|sorting|ordenacao|ordena[cç][aã]o|bolha|busca|hash|tree|arvore|arvores|merge|quick|heap|selection|insertion)\b/i.test(context)) {
        return "Pesquisa e Ordenação";
    }

    if (/\b(factory|strategy|observer|adapter|decorator|singleton|builder|prototype|command|pattern|padrao|padroes)\b/i.test(context)) {
        return "Padrões de Projeto";
    }

    return "";
}

function withDisciplineSpecialization(disciplina: string, file: RepoFile | null | undefined): string {
    const ronaldoSpecialized = inferRonaldoDisciplineByContext(file);
    if (ronaldoSpecialized) {
        return ronaldoSpecialized;
    }

    return appendDisciplineLevel(disciplina, file?.path);
}

export function inferDisciplina(file: RepoFile | null | undefined): string {
    const path = normalizePath(file?.path);
    const parts = path.split("/").filter(Boolean);

    for (let i = parts.length - 2; i >= 0; i -= 1) {
        const part = stripProfessorSuffixFromFolderPart(fixMojibake(parts[i]).trim());
        if (!part) {
            continue;
        }

        const comparable = normalizeComparable(part);
        const { sigla, name } = getSiglaAndName(part);
        const hasLetterInSigla = /[A-Z]/.test(sigla);
        const hasExplicitName = /^\s*[A-Za-z]{2,10}\s*[-–—_]\s*.+$/.test(part);
        const hasGenericPrefix = /^(?:trabalho|projeto|project|atividade|lista|lab|aula)s?\b/i.test(comparable);
        const isGenericContextFolder =
            GENERIC_CONTEXT_FOLDERS.has(comparable) ||
            /^(?:trabalho|projeto|project|atividade|lista|lab)\s*\d*(?:\s*[-–—]\s*.+)?$/i.test(comparable);

        if (isLikelyProfessorFolder(part)) {
            continue;
        }

        const previousPart = parts[i - 1] ?? "";
        const previousComparable = normalizeComparable(previousPart);
        const isLikelyYearSemester = /^(?:19|20)\d{2}[._\-\s]?[12]$/.test(previousComparable);
        const isLikelyNameFolder = /^[A-Za-zÀ-ÿ]{3,}(?:\s+[A-Za-zÀ-ÿ]{2,}){0,3}$/.test(part);
        if (isLikelyYearSemester && isLikelyNameFolder) {
            continue;
        }

        if (sigla && hasLetterInSigla && !hasGenericPrefix) {
            const resolvedByContext = resolveDisciplinaBySigla(sigla, path);
            if (name) {
                const normalizedName = normalizeText(name);
                if (sigla === "CA" || sigla === "CALC") {
                    if (/^calculo\s+(?:i{1,3}|[123])$/i.test(normalizeComparable(normalizedName))) {
                        return normalizedName;
                    }
                    if (/^calculo$/i.test(normalizeComparable(normalizedName))) {
                        const calculoLevel = inferCalculoLevelFromPath(path);
                        if (calculoLevel) {
                            return `${normalizedName} ${calculoLevel}`;
                        }
                    }
                }
                if (hasExplicitName) {
                    if (
                        resolvedByContext &&
                        normalizeComparable(resolvedByContext).includes(normalizeComparable(normalizedName))
                    ) {
                        return withDisciplineSpecialization(resolvedByContext, file);
                    }
                    return withDisciplineSpecialization(normalizedName, file);
                }
                if (!resolvedByContext) {
                    return withDisciplineSpecialization(normalizedName, file);
                }
                return withDisciplineSpecialization(resolvedByContext, file);
            }
            if (resolvedByContext) {
                return withDisciplineSpecialization(resolvedByContext, file);
            }
        }

        const isIgnored =
            IGNORED_SUBJECT_FOLDERS.has(comparable) ||
            TOPIC_SUBJECT_FOLDERS.has(comparable) ||
            isGenericContextFolder ||
            /^documentos(?:\b|\s*[-_])/i.test(comparable) ||
            /^[sn]\d{1,2}$/i.test(comparable) ||
            /^\d{4}/.test(comparable) ||
            /^\d+(?:[._\-]\d+)+$/.test(comparable);
        if (isIgnored) {
            continue;
        }

        if (name) {
            return withDisciplineSpecialization(fixMojibake(name).trim(), file);
        }

        return withDisciplineSpecialization(part, file);
    }

    const inferredFromFileName = inferDisciplinaFromFileName(file?.name);
    if (inferredFromFileName) {
        return withDisciplineSpecialization(inferredFromFileName, file);
    }

    const inferredFromRepoRoot = inferDisciplinaFromRepositoryRoot(path);
    if (inferredFromRepoRoot) {
        return withDisciplineSpecialization(inferredFromRepoRoot, file);
    }

    const inferredFromProfessorContext = inferDisciplinaFromProfessorContext(file);
    if (inferredFromProfessorContext) {
        return withDisciplineSpecialization(inferredFromProfessorContext, file);
    }

    const professor = inferProfessorFromPath(path);
    if (professor) {
        return `Outros - Prof. ${professor}`;
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

function inferDisciplinaFromProfessorContext(file: RepoFile | null | undefined): string {
    const path = normalizePath(file?.path);
    const professor = inferProfessorFromPath(path);
    if (professor !== "Ronaldo Fernandes Ramos") {
        return "";
    }

    const extension = normalizeComparable(file?.extension).replace(/^\./, "");
    const context = `${normalizeComparable(path)} ${normalizeComparable(file?.name)}`;
    const poHints = [
        /\bbubble\s*sort\b/i,
        /\bmerge\s*sort\b/i,
        /\bquick\s*sort\b/i,
        /\bselection\s*sort\b/i,
        /\binsertion\s*sort\b/i,
        /\bheap\s*sort\b/i,
        /\b(ordena[cç][aã]o|ordenacao|sort|sorting|busca|search|hash|arvore|tree)\b/i,
    ];
    const designPatternHints = [
        /\b(factory|strategy|observer|adapter|decorator|singleton|builder|prototype|command|pattern|padrao|padroes)\b/i,
    ];

    const hasDirectPoFolder = /\b(?:pesquisa\s+e\s+ordenac(?:ao|ão)|ordenac(?:ao|ão))\b/i.test(context);
    const hasDirectPatternFolder = /\b(?:padroes\s+de\s+projeto|padrões\s+de\s+projeto)\b/i.test(context);
    const hasPoHint = hasDirectPoFolder || poHints.some((pattern) => pattern.test(context));
    const hasPatternHint = designPatternHints.some((pattern) => pattern.test(context));

    if (hasDirectPoFolder && !hasDirectPatternFolder) {
        return "Pesquisa e Ordenação";
    }

    if (hasDirectPatternFolder && !hasDirectPoFolder) {
        return "Padrões de Projeto";
    }

    if (hasPoHint && !hasPatternHint) {
        return "Pesquisa e Ordenação";
    }

    if (hasPatternHint && !hasPoHint) {
        return "Padrões de Projeto";
    }

    if (["ipynb", "af", "idl"].includes(extension) && hasPoHint) {
        return "Pesquisa e Ordenação";
    }

    return "";
}

function getGradeSemesterFromPath(path: unknown): string {
    const semesterNumber = getSemesterNumberFromPath(path);
    if (!semesterNumber || semesterNumber <= 0) {
        return "";
    }
    return `Grade S${String(semesterNumber).padStart(2, "0")}`;
}

export function inferSemester(file: RepoFile | null | undefined): string {
    const name = safeString(file?.name);
    const path = normalizePath(file?.path);

    const semesterFromName = getAcademicSemesterFromText(name);
    if (semesterFromName) {
        return semesterFromName;
    }

    const semesterFromPath = getAcademicSemesterFromText(path);
    if (semesterFromPath) {
        return semesterFromPath;
    }

    const yearFromName = getYearFromText(name);
    if (yearFromName) {
        return yearFromName;
    }

    const yearFromPath = getYearFromText(path);
    if (yearFromPath) {
        return yearFromPath;
    }

    return getGradeSemesterFromPath(path);
}

export function inferTags(file: RepoFile | null | undefined): string[] {
    const tags = new Set<string>();
    const normalizedPath = normalizePath(file?.path);
    const fileName = safeString(file?.name);
    const subjectPart = getSubjectPart(normalizedPath);
    const { sigla } = getSiglaAndName(subjectPart);
    const disciplina = inferDisciplina(file);
    const resolvedSigla = isLikelySigla(sigla) ? sigla : getResolvedSiglaFromDisciplina(disciplina);
    const semester = inferSemester(file);
    const tipo = inferTipo(file);
    const extension = normalizeComparable(file?.extension).replace(/^\./, "");
    const upperPath = normalizeComparable(normalizedPath).toUpperCase();
    const retakeLabel = getRetakeLabelFromFile(file);

    if (resolvedSigla) {
        tags.add(resolvedSigla);
    }

    if (disciplina && disciplina !== "Geral") {
        tags.add(disciplina);
    } else if (subjectPart) {
        tags.add(normalizeText(subjectPart));
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
        if (retakeLabel) {
            tags.add(retakeLabel);
        }
    }

    const extensionTag = TAG_BY_EXTENSION[extension];
    if (extensionTag) {
        tags.add(extensionTag);
    }

    if (["dsn", "pdsprj", "pdsit", "pdsbak", "m", "fig", "bdf", "bsf", "vpr", "sof", "pof", "mcp", "mcs", "mcw", "af"].includes(extension)) {
        tags.add("Simulação");
    }

    if (extension === "m") {
        tags.add("Script");
    }

    if (HARDWARE_TAG_EXTENSIONS.has(extension)) {
        tags.add("Hardware");
    }

    if (["dsn", "pdsprj", "pdsit", "mcp", "mcs", "mcw"].includes(extension)) {
        tags.add("Projeto");
    }

    let profName = "";
    const pathParts = normalizePath(normalizedPath).split("/").filter(Boolean);

    for (let i = 0; i < pathParts.length - 1; i += 1) {
        const part = fixMojibake(pathParts[i]).trim();
        const normalizedPart = normalizeComparable(part);

        const yearDashProfessor = part.match(/^(?:19|20)\d{2}[._\-\s]?[12]\s*[-–—]\s*(.+)$/i);
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
        const normalizedProfessorTag = normalizeProfessorName(profName);
        if (normalizedProfessorTag.length >= 2 && /[A-Z]/.test(normalizedProfessorTag)) {
            tags.add(normalizedProfessorTag);
        }
        if (normalizedProfessorTag === normalizeText(profName).toUpperCase() && isLikelyUnmappedProfessorName(profName)) {
            tags.add("Professor");
        }
    }

    if (!profName) {
        for (const part of pathParts) {
            const normalizedPart = normalizeText(part);
            if (!normalizedPart) {
                continue;
            }
            const comparablePartUpper = normalizeComparable(part).toUpperCase();
            let aliasMatch = "";
            for (const [alias, canonical] of PROFESSOR_CANONICAL_MAP.entries()) {
                if (alias.length >= 3 && comparablePartUpper.includes(alias)) {
                    aliasMatch = canonical;
                    break;
                }
            }
            if (aliasMatch) {
                tags.add(aliasMatch);
                break;
            }
            const normalizedProfessorTag = normalizeProfessorName(part);
            if (!normalizedProfessorTag || normalizedProfessorTag === normalizedPart.toUpperCase()) {
                continue;
            }
            if (normalizedProfessorTag.length >= 2 && /[A-Z]/.test(normalizedProfessorTag)) {
                tags.add(normalizedProfessorTag);
                break;
            }
        }
    }

    const normalizedPathComparable = normalizeComparable(normalizedPath);
    const normalizedFileNameComparable = normalizeComparable(fileName.replace(/\.[^/.]+$/, ""));
    const stageMatches = Array.from(
        normalizedPathComparable.matchAll(/(?:^|\/)(?:n|av|ap|p)\s*([1-4])(?:[._-]\d+)?(?:\/|$)/gi),
    )
        .map((match) => match[1])
        .filter(Boolean);
    const stageNameMatches = Array.from(
        normalizedFileNameComparable.matchAll(/\b(?:prova|avaliac(?:ao|ão)|n|av|ap|p)\s*[-_ ]?([1-4])\b/gi),
    )
        .map((match) => match[1])
        .filter(Boolean);
    const stageSetFromPath = new Set(stageMatches);
    const stageSetFromName = new Set(stageNameMatches);
    const allResolvedStages = new Set<string>();

    if (stageSetFromPath.size > 0) {
        if (stageSetFromName.size <= 1) {
            for (const assessmentTag of ["AV1", "AV2", "AV3", "AV4"]) {
                tags.delete(assessmentTag);
            }
        }
        for (const stage of stageSetFromPath) {
            allResolvedStages.add(stage);
        }
        if (stageSetFromName.size > 1) {
            for (const stage of stageSetFromName) {
                allResolvedStages.add(stage);
            }
        }
    } else {
        for (const stage of stageSetFromName) {
            allResolvedStages.add(stage);
        }
    }

    for (const stage of allResolvedStages) {
        tags.add(`AV${stage}`);
    }

    if (/GABARITO/i.test(fileName) || /GABARITO/i.test(normalizedPath)) {
        tags.add("Gabarito");
    }
    if (/RESPOSTAS?/i.test(fileName) || /RESPOSTAS?/i.test(normalizedPath)) {
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

    const protectedLongTags = new Set(
        [resolvedSigla, disciplina, ...KNOWN_PROFESSORS]
            .map((value) => normalizeComparable(value))
            .filter(Boolean),
    );

    const cleanedTags = Array.from(tags).filter((tag) => {
        if (!tag) {
            return false;
        }
        const normalizedTag = normalizeComparable(tag);
        if (tag.length > 25 && !protectedLongTags.has(normalizedTag)) {
            return false;
        }
        return !/^\d+\s*[.)-]\s*/.test(normalizeText(tag));
    });

    return dedupeTagsByContent(cleanedTags, [resolvedSigla, disciplina, ...KNOWN_PROFESSORS]);
}
