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