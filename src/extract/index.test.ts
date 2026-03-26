import test from "node:test";
import assert from "node:assert/strict";

import { dedupeUnicodeEquivalentPaths } from "./index";
import { RepoFile } from "../types";

function makeFile(path: string, name: string, extension: string): RepoFile {
    return {
        kind: "file",
        path,
        name,
        extension,
    };
}

test("deduplica caminhos unicode equivalentes em NFC/NFD", () => {
    const files: RepoFile[] = [
        makeFile("/S01/ED - Eletro\u0302nica Digital/PUD Eletro\u0302nica Digital.doc", "PUD Eletro\u0302nica Digital.doc", "doc"),
        makeFile("/S01/ED - Eletrônica Digital/PUD Eletrônica Digital.doc", "PUD Eletrônica Digital.doc", "doc"),
    ];

    const deduped = dedupeUnicodeEquivalentPaths(files);
    assert.equal(deduped.length, 1);
    assert.equal(deduped[0]?.path, "/S01/ED - Eletrônica Digital/PUD Eletrônica Digital.doc".normalize("NFC"));
});
