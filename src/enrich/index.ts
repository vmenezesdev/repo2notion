import { normalize } from "node:path";
import { RecordCandidate, RepoFile } from "../types";

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
export function inferMetadata(file: RepoFile): RecordCandidate {
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
    return '';
}

export function inferTipo(file: RepoFile): string {
    return '';
}

export function inferDisciplina(file: RepoFile): string {
    return '';
}

export function inferSemester(file: RepoFile): string {
    return '';
}

export function inferTags(file: RepoFile): string[] {
    return [];
}
