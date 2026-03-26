import { writeFile } from "fs";

export async function clearIntermediateResults(intermediateResults: string[] = ["repoTree.json"]) {
    for (const filename of intermediateResults) {
        await writeFile(filename, "", (err) => {
            if (err) {
                console.error(`Error clearing ${filename}: `, err);
            }
        });
    }
}

export async function saveIntermediateResult(filename: string, data: any) {
    await writeFile(filename, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error(`Error writing ${filename} to file: `, err);
        } else {
            console.log(`${filename} saved successfully`);
        }
    });
}
