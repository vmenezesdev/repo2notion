import { RepoFile, RepoNode, RepoNodeKind } from "../types";

const IGNORED_FILE_NAMES = new Set([
    ".ds_store",
    "thumbs.db",
    "desktop.ini",
    ".replit",
    "readme",
    "readme.md",
    "readme.txt",
    "license",
    "license.md",
    ".gitignore",
    ".gitattributes",
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "tsconfig.json",
    "jsconfig.json",
]);

const IGNORED_EXTENSIONS = new Set([
    "db",
    "tmp",
    "temp",
    "bak",
    "old",
    "orig",
    "swp",
    "lock",
    "exe",
    "jar",
    "o",
    "obj",
    "class",
    "pdsbak",
    "workspace",
]);

const IGNORED_PATH_MARKERS = [
    "/node_modules/",
    "/.vscode/",
    "/.idea/",
    "/dist/",
    "/build/",
    "/coverage/",
    "/target/",
    "/bin/",
    "/obj/",
    "/__pycache__/",
    "/.venv/",
    "/venv/",
    "/incremental_db/",
    "/output_files/",
    "/db_info/",
];

function normalizeComparable(value: string): string {
    return String(value ?? "")
        .normalize("NFC")
        .replace(/\\/g, "/")
        .replace(/\/+/g, "/")
        .toLowerCase();
}

function getComparableExtension(file: RepoFile): string {
    const extension = String(file.extension ?? "").trim().toLowerCase();
    if (extension) return extension;

    const normalizedName = String(file.name ?? "").trim().toLowerCase();
    const nameParts = normalizedName.split(".");
    return nameParts.length > 1 ? nameParts[nameParts.length - 1] ?? "" : "";
}

function isIgnoredCollectedFile(file: RepoFile): boolean {
    const comparableName = normalizeComparable(file.name);
    if (IGNORED_FILE_NAMES.has(comparableName)) {
        return true;
    }

    const comparableExtension = getComparableExtension(file);
    if (IGNORED_EXTENSIONS.has(comparableExtension)) {
        return true;
    }

    const comparablePath = normalizeComparable(file.path);
    return IGNORED_PATH_MARKERS.some((marker) => comparablePath.includes(marker));
}

// RepoDirectory MigrationOptions -> MigrationPlan
// Produz uma lista com todos os arquivos encontrados em um nó do repositório
// Se o nó for um arquivo, devolve uma lista contendo somente esse arquivo
// Se o nó for um diretório, devolve todos os arquivos de seus filhos recursivamente
export function collectFiles(node: RepoNode): RepoFile[] {
    if (node.kind === RepoNodeKind.FILE) {
        const file: RepoFile = {
            kind: RepoNodeKind.FILE,
            name: node.name,
            path: node.path,
            extension: node.extension,
            children: [],
        };
        return isIgnoredCollectedFile(file) ? [] : [file];
    } else if (node.kind === RepoNodeKind.DIRECTORY) {
        return node.children.flatMap(collectFiles);
    } else {
        return [];
    }
}

export function removeLfsPaths(files: RepoFile[]): RepoFile[] {
    // .git/lfs/
    return files.filter((file) => !file.path.includes(".git/lfs/"));
}

export function removeGitPaths(files: RepoFile[]): RepoFile[] {
    // .git/
    return files
    .filter((file) => !file.path.includes(".git/"))
    .filter((file) => !file.path.includes(".github/"))
    .filter((file) => !file.path.includes(".gitattributes"))
    .filter((file) => !file.path.includes(".gitignore"));
}

function normalizeComparablePath(path: string): string {
    return normalizeComparable(path);
}

export function dedupeUnicodeEquivalentPaths(files: RepoFile[]): RepoFile[] {
    const seen = new Set<string>();
    const deduped: RepoFile[] = [];

    for (const file of files) {
        const key = normalizeComparablePath(file.path);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        deduped.push({
            ...file,
            path: String(file.path ?? "").normalize("NFC"),
            name: String(file.name ?? "").normalize("NFC"),
            extension: String(file.extension ?? "").normalize("NFC"),
        });
    }

    return deduped;
}