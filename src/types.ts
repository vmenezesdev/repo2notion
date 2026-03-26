export type MigrationOptions = {}

/**
 * A file in the repository scan result.
 */
export type RepoFile = {
    kind: "file";
    name: string;
    path: string;
    extension: string;
}

/**
 * A directory with nested children.
*/
export type RepoDirectory = {
    kind: "directory";
    name: string;
    path: string;
    children: RepoNode[];
}

/**
 * Node in repository tree scan result (file or directory).
 */
export type RepoNode = RepoFile | RepoDirectory;

export type RecordCandidate = {
    title: string;
    sourcePath: string;
    tipo?: string;
    disciplina?: string;
    semester?: string;
    url?: string;
    tags: string[];
}

export type MigrationResult = {}