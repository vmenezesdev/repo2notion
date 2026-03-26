import { RepoFile, RepoNode } from "../types";

// RepoDirectory MigrationOptions -> MigrationPlan
// Produz uma lista com todos os arquivos encontrados em um nó do repositório
// Se o nó for um arquivo, devolve uma lista contendo somente esse arquivo
// Se o nó for um diretório, devolve todos os arquivos de seus filhos recursivamente
export function collectFiles(node: RepoNode): RepoFile[] {
    if (node?.kind === "file") {
        return [node];
    } else if (node?.kind === "directory") {
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
    return String(path ?? "")
        .normalize("NFC")
        .replace(/\\/g, "/")
        .replace(/\/+/g, "/")
        .toLowerCase();
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