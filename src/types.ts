export interface MigrationOptions {}

export enum RepoNodeKind {
  FILE = "file",
  DIRECTORY = "directory",
}

/**
 * A file in the repository scan result.
 */
export interface RepoNode {
  kind: RepoNodeKind;
  name: string;
  path: string;
  extension: string;
  children: RepoNode[];
}

/**
 * A file in the repository scan result.
 */
export interface RepoFile extends RepoNode {
  kind: RepoNodeKind.FILE;
}

/**
 * A directory with nested children.
*/
export interface RepoDirectory extends RepoNode {
  kind: RepoNodeKind.DIRECTORY;
}

export interface RecordCandidate {
  title: string;
  sourcePath: string;
  tipo?: string;
  disciplina?: string;
  semester?: string;
  url?: string;
  tags: string[];
}

export enum ConfidenceSource {
  RULE = "rule",
  AI = "ai",
}

export interface RuleInference {
  disciplina: string;
  tipo: string;
  semester: string;
  title: string;
  sigla: string;
  topics: string[];
  score: number;
  reasons: string[];
}

export interface ScoreMetadata {
  score: number;
  source: ConfidenceSource;
  reasons: string[];
}

export interface RecordCandidateWithRefinedMetadata extends RecordCandidate {
  scoreMetadata: ScoreMetadata;
}


export interface MigrationResult {}