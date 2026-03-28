import { readdir } from "fs/promises";
import { join } from "path";

import { RepoDirectory, RepoNode, RepoNodeKind } from "../types";
import { Dirent } from "fs";

async function scanRepository(path: string): Promise<RepoDirectory> {
    return scanDirectory(path);
}

async function scanDirectory(path: string): Promise<RepoDirectory> {
    const dirents = await readdir(path, { withFileTypes: true });

    return {
        kind: RepoNodeKind.DIRECTORY,
        name: "",
        path: path,
        extension: "",
        children: await Promise.all(dirents.map((dirent) => scanDirent(dirent, path)))
    };
}

async function scanDirent(dirent: Dirent, parentPath: string): Promise<RepoNode> {

    if(dirent.isFile()) {
        return {
            kind: RepoNodeKind.FILE,
            name: dirent.name,
            extension: getFileExtension(dirent.name),
            path: join(parentPath, dirent.name),
            children: [],
        }
    } else if (dirent.isDirectory()) {
        return await scanDirectory(join(parentPath, dirent.name));
    } else {
        throw new Error(`Unsupported directory entry type: ${dirent.name}`);
    }
}

function getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
}

export { scanRepository };