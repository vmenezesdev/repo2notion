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


console.log("repo2notion starting...");
console.log(process.argv)

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
    await clearIntermediateResults(
        ["repoTree.json"]
    );
    await saveIntermediateResult("repoTree.json", repoTree);

    console.log(repoTree);
    // const migrationPlan = buildMigrationPlan(repoTree, options);
    // const result = await executeMigrationPlan(migrationPlan, options);
    // return result;
    return {};
}

(async () => {
    await migrateRepo(targetDir, {});
})();


// In order to track progress we will save the directory strucutre in a local file

console.log("Config ok");