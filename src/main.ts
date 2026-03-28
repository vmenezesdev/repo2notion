// > High level pipeline: scan repo -> build index -> transform -> push to Notion
// # Core steps:
// 1. Read directory strucutre
// 2. Normalize file/folder names
// 3. Create a flat index of content with metadata in place of nested folders 4 Create Notion database entries for each content item
// 4. Upload files as attachments and link to original repo paths

import "dotenv/config";
import { MigrationOptions, MigrationResult, RecordCandidateWithRefinedMetadata, RepoFile } from "./types";
import { scanRepository } from "./scan";
import { clearIntermediateResults, saveIntermediateResult } from "./util";
import { collectFiles, dedupeUnicodeEquivalentPaths, removeGitPaths, removeLfsPaths } from "./extract";
import { refineMetadata } from "./ai-refine";
import { exportToNotion } from "./notion";


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

const DEFAULT_SCORE_THRESHOLD = 80;
const DEFAULT_BATCH_SIZE = 40;
const DEFAULT_BATCH_SIZE_LARGE_REPO = 20;
const LARGE_REPO_FILE_COUNT = 500;

function parsePositiveInt(value: string | undefined): number | null {
    if (!value) return null;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
}

function getScoreThreshold(): number {
    const parsed = parsePositiveInt(process.env.SCORE_THRESHOLD);
    if (parsed === null) return DEFAULT_SCORE_THRESHOLD;
    return Math.max(1, Math.min(100, parsed));
}

function getRefineBatchSize(totalFiles: number): number {
    const configured = parsePositiveInt(process.env.REFINE_BATCH_SIZE);
    if (configured !== null) return configured;
    return totalFiles > LARGE_REPO_FILE_COUNT ? DEFAULT_BATCH_SIZE_LARGE_REPO : DEFAULT_BATCH_SIZE;
}

async function refineFilesInBatches(files: RepoFile[], batchSize: number) : Promise<RecordCandidateWithRefinedMetadata[]> {
    const candidates : RecordCandidateWithRefinedMetadata[] = [];

    for (let i = 0; i < files.length; i += batchSize) {
        const chunk = files.slice(i, i + batchSize);
        const chunkCandidates = await Promise.all(chunk.map(async (file) => refineMetadata(file)));
        candidates.push(...chunkCandidates);

        const completed = Math.min(i + chunk.length, files.length);
        console.log(`Refined ${completed}/${files.length} files (batch size ${batchSize})`);
    }

    return candidates;
}




// migrateRepo: RepoPath Config -> MigrationResult
async function migrateRepo(rootPath: string, _options: MigrationOptions): Promise<MigrationResult> {
    const repoTree = await scanRepository(rootPath);
    const files = dedupeUnicodeEquivalentPaths(removeGitPaths(removeLfsPaths(collectFiles(repoTree))));
    const scoreThreshold = getScoreThreshold();
    const refineBatchSize = getRefineBatchSize(files.length);
    const recordCandidates = await refineFilesInBatches(files, refineBatchSize);

    const goodCandidates = recordCandidates.filter(c => c.scoreMetadata.score >= scoreThreshold);
    const badCandidates = recordCandidates.filter(c => c.scoreMetadata.score < scoreThreshold);
    const uncategorizedCandidates = badCandidates;

    console.log(`Total files: ${files.length}`);
    console.log(`Score threshold: ${scoreThreshold}`);
    console.log(`Good candidates (score >= ${scoreThreshold}): ${goodCandidates.length}`);
    console.log(`Bad candidates (score < ${scoreThreshold}): ${badCandidates.length}`);

    await clearIntermediateResults(
        [
            "repoTree.json",
            "files.json",
            "recordCandidates.json",
            "goodCandidates.json",
            "badCandidates.json",
            "uncategorizedCandidates.json",
            "oversizedFiles.json",
        ]
    );
    await saveIntermediateResult("repoTree.json", repoTree);
    await saveIntermediateResult("files.json", files);
    await saveIntermediateResult("recordCandidates.json", recordCandidates);
    await saveIntermediateResult("goodCandidates.json", goodCandidates);
    await saveIntermediateResult("badCandidates.json", badCandidates);
    await saveIntermediateResult("uncategorizedCandidates.json", uncategorizedCandidates);

    const oversizedFiles = await exportToNotion(goodCandidates);
    console.log(`Files skipped due to 20 MB limit: ${oversizedFiles.length}`);
    await saveIntermediateResult("oversizedFiles.json", oversizedFiles);

    return {};
}

(async () => {
    await migrateRepo(targetDir, {});
})();


// In order to track progress we will save the directory strucutre in a local file

console.log("Config ok");