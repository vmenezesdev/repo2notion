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

export type ConfidenceSource = "rule" | "ai";

export type RuleInference = {
  disciplina: string | null;
  tipo: string | null;
  semester: string | null;
  title: string;
  sigla?: string;
  topics?: string[];
  score: number;
  reasons: string[];
};

export type RecordCandidateWithRefinedMetadata = RecordCandidate & {
  scoreMetadata: {
    score: number;
    source: ConfidenceSource;
    reasons: string[];
  }
};


export type MigrationResult = {}