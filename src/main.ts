// > High level pipeline: scan repo -> build index -> transform -> push to Notion
// # Core steps:
// 1. Read directory strucutre
// 2. Normalize file/folder names
// 3. Create a flat index of content with metadata in place of nested folders 4 Create Notion database entries for each content item
// 4. Upload files as attachments and link to original repo paths

import "dotenv/config";
import { MigrationOptions, MigrationResult, RepoDirectory, RepoNode } from "./types";
import { scanRepository } from "./scan";
import { clearIntermediateResults, saveIntermediateResult } from "./util";
import { clear } from "node:console";
import { collectFiles, dedupeUnicodeEquivalentPaths, removeGitPaths, removeLfsPaths } from "./extract";
import { refineMetadata } from "./ai-refine";


console.log("repo2notion starting...");

const apiKey = process.env.NOTION_API_KEY;
const rootPageId = process.env.NOTION_ROOT_PAGE_ID;
const targetDir = process.argv[2];

if (!apiKey || !rootPageId) {
    throw new Error("Missing environment variables");
}

if (!targetDir) {
    throw new Error("Missing target directory");
}




// migrateRepo: RepoPath Config -> MigrationResult
async function migrateRepo(rootPath: string, _options: MigrationOptions): Promise<MigrationResult> {
    const repoTree = await scanRepository(rootPath);
    const files = dedupeUnicodeEquivalentPaths(removeGitPaths(removeLfsPaths(collectFiles(repoTree))));
    const recordCandidates = await Promise.all(files.map(async (file) => await refineMetadata(file)));

    await clearIntermediateResults(
        ["repoTree.json", "files.json", "recordCandidates.json"]
    );
    await saveIntermediateResult("repoTree.json", repoTree);
    await saveIntermediateResult("files.json", files);
    await saveIntermediateResult("recordCandidates.json", recordCandidates);

    // return result;

    return {};
}

(async () => {
    await migrateRepo(targetDir, {});
})();


// In order to track progress we will save the directory strucutre in a local file

console.log("Config ok");