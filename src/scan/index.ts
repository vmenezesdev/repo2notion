import { readdir } from "fs/promises";

import { RepoDirectory, RepoNode } from "../types";
import { Dirent } from "fs";

async function scanRepository(path: string): Promise<RepoDirectory> {
    return scanDirectory(path);
}

async function scanDirectory(path: string): Promise<RepoDirectory> {
    const dirents = await readdir(path, { withFileTypes: true });

    return {
        kind: "directory",
        name: "",
        path: path,
        children: await Promise.all(dirents.map((dirent) => scanDirent(dirent, dirent.parentPath)))
    };
}

async function scanDirent(dirent: Dirent, parentPath: string): Promise<RepoNode> {

    if(dirent.isFile()) {
        return {
            kind: "file",
            name: dirent.name,
            extension: getFileExtension(dirent.name),
            path: `${parentPath}/${dirent.name}`
        }
    } else if (dirent.isDirectory()) {
        return await scanDirectory(`${parentPath}/${dirent.name}`);
    } else {
    //    console.warn("Found unsupprted dirent type: ", dirent);
    }
}

function getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1] : undefined;
}

export { scanRepository };