import test from "node:test";
import assert from "node:assert/strict";

import { collectFiles, dedupeUnicodeEquivalentPaths } from "./index";
import { RepoFile, RepoNode, RepoNodeKind } from "../types";

function makeFile(path: string, name: string, extension: string): RepoFile {
    return {
        kind: RepoNodeKind.FILE,
        path,
        name,
        extension,
        children: [],
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

test("collectFiles ignora arquivos de sistema e compilação", () => {
    const tree: RepoNode = {
        kind: RepoNodeKind.DIRECTORY,
        name: "",
        path: "/repo",
        extension: "",
        children: [
            makeFile("/repo/Thumbs.db", "Thumbs.db", "db"),
            makeFile("/repo/projeto/main.o", "main.o", "o"),
            makeFile("/repo/projeto/simulacao.pdsbak", "simulacao.pdsbak", "pdsbak"),
            makeFile("/repo/projeto/programa.exe", "programa.exe", "exe"),
            makeFile("/repo/projeto/material.pdf", "material.pdf", "pdf"),
        ],
    };

    const files = collectFiles(tree);
    assert.equal(files.length, 1);
    assert.equal(files[0]?.name, "material.pdf");
});

test("collectFiles ignora arquivos de configuração comuns", () => {
    const tree: RepoNode = {
        kind: RepoNodeKind.DIRECTORY,
        name: "",
        path: "/repo",
        extension: "",
        children: [
            makeFile("/repo/README.md", "README.md", "md"),
            makeFile("/repo/.replit", ".replit", ""),
            makeFile("/repo/aulas/lista1.pdf", "lista1.pdf", "pdf"),
        ],
    };

    const files = collectFiles(tree);
    assert.equal(files.length, 1);
    assert.equal(files[0]?.name, "lista1.pdf");
});
