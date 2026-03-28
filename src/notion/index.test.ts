import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ConfidenceSource, RecordCandidateWithRefinedMetadata } from "../types";

type NotionModule = typeof import("./index");

const NOTION_MODULE_PATH = resolve(process.cwd(), "src/notion/index.ts");

async function loadNotionModule(): Promise<NotionModule> {
    const moduleUrl = pathToFileURL(NOTION_MODULE_PATH);
    moduleUrl.searchParams.set("cache", `${Date.now()}-${Math.random()}`);
    return import(moduleUrl.href);
}

function installImmediateTimers(t: any, delays?: number[]) {
    let now = 0;
    t.mock.method(Date, "now", () => {
        now += 1000;
        return now;
    });

    t.mock.method(
        globalThis,
        "setTimeout",
        ((callback: (...args: any[]) => void, ms?: number) => {
            if (typeof ms === "number" && delays) {
                delays.push(ms);
            }
            callback();
            return {} as NodeJS.Timeout;
        }) as typeof setTimeout,
    );
}

async function createTempFileWithHash(content: string): Promise<{ filePath: string; hash: string }> {
    const dir = await mkdtemp(join(tmpdir(), "repo2notion-notion-test-"));
    const filePath = join(dir, "material.txt");
    await writeFile(filePath, content, "utf8");

    const hash = createHash("sha256").update(content).digest("hex");
    return { filePath, hash };
}

function makeCandidate(
    sourcePath: string,
    overrides: Partial<RecordCandidateWithRefinedMetadata> = {},
): RecordCandidateWithRefinedMetadata {
    return {
        title: "Material teste",
        sourcePath,
        tipo: "Resumo",
        disciplina: "Calculo I",
        semester: "2024.1",
        url: "https://example.com/material",
        tags: ["tag-1", "tag-2"],
        scoreMetadata: {
            score: 95,
            source: ConfidenceSource.RULE,
            reasons: ["fixture"],
        },
        ...overrides,
    };
}

test("getDatasource retorna null quando database nao tem data sources", async (t) => {
    installImmediateTimers(t);
    process.env.NOTION_ROOT_PAGE_ID = "db-root";

    const { getDatasource, notion } = await loadNotionModule();

    t.mock.method(notion.databases, "retrieve", async () => ({ data_sources: [] } as any));
    t.mock.method(notion.dataSources, "retrieve", async () => {
        throw new Error("nao deveria buscar datasource sem id");
    });

    const datasource = await getDatasource();
    assert.equal(datasource, null);
});

test("getDatasource retorna o primeiro data source da lista", async (t) => {
    installImmediateTimers(t);
    process.env.NOTION_ROOT_PAGE_ID = "db-root";

    const { getDatasource, notion } = await loadNotionModule();

    let capturedDatabaseId = "";
    let capturedDataSourceId = "";

    t.mock.method(notion.databases, "retrieve", async (params: any) => {
        capturedDatabaseId = params.database_id;
        return { data_sources: [{ id: "ds-1" }, { id: "ds-2" }] } as any;
    });
    t.mock.method(notion.dataSources, "retrieve", async (params: any) => {
        capturedDataSourceId = params.data_source_id;
        return { id: "ds-1", name: "Materiais" } as any;
    });

    const datasource = await getDatasource();

    assert.equal(capturedDatabaseId, "db-root");
    assert.equal(capturedDataSourceId, "ds-1");
    assert.deepEqual(datasource, { id: "ds-1", name: "Materiais" });
});

test("exportToNotion encerra sem upload quando nao encontra data source", async (t) => {
    installImmediateTimers(t);
    process.env.NOTION_ROOT_PAGE_ID = "db-root";

    const { exportToNotion, notion } = await loadNotionModule();
    const { filePath } = await createTempFileWithHash("conteudo-1");

    let createCalls = 0;
    const errorMessages: string[] = [];

    t.mock.method(notion.databases, "retrieve", async () => ({ data_sources: [] } as any));
    t.mock.method(notion.pages, "create", async () => {
        createCalls += 1;
        return {} as any;
    });
    t.mock.method(console, "error", (...args: any[]) => {
        errorMessages.push(args.map(String).join(" "));
    });

    await exportToNotion([makeCandidate(filePath)]);

    assert.equal(createCalls, 0);
    assert.ok(errorMessages.some((msg) => msg.includes("No data source found in Notion database")));
});

test("exportToNotion cria pagina com idempotency key baseada no hash do arquivo", async (t) => {
    installImmediateTimers(t);
    process.env.NOTION_ROOT_PAGE_ID = "db-root";

    const { exportToNotion, notion } = await loadNotionModule();
    const { filePath, hash } = await createTempFileWithHash("arquivo-unico-2");

    let queryPayload: any;
    let createPayload: any;

    t.mock.method(notion.databases, "retrieve", async () => ({ data_sources: [{ id: "ds-1" }] } as any));
    t.mock.method(notion.dataSources, "retrieve", async () => ({ id: "ds-1" } as any));
    t.mock.method(notion.dataSources, "query", async (params: any) => {
        queryPayload = params;
        return { results: [] } as any;
    });
    t.mock.method(notion.pages, "create", async (params: any) => {
        createPayload = params;
        return { id: "page-1" } as any;
    });

    await exportToNotion([makeCandidate(filePath)]);

    assert.equal(queryPayload.filter.rich_text.equals, hash);
    assert.equal(queryPayload.data_source_id, "ds-1");
    assert.equal(createPayload.parent.data_source_id, "ds-1");
    assert.equal(createPayload.properties.IdempotencyKey.rich_text[0].text.content, hash);
});

test("exportToNotion pula upload quando idempotency key ja existe no datasource", async (t) => {
    installImmediateTimers(t);
    process.env.NOTION_ROOT_PAGE_ID = "db-root";

    const { exportToNotion, notion } = await loadNotionModule();
    const { filePath } = await createTempFileWithHash("arquivo-unico-3");

    let createCalls = 0;
    const infoMessages: string[] = [];

    t.mock.method(notion.databases, "retrieve", async () => ({ data_sources: [{ id: "ds-1" }] } as any));
    t.mock.method(notion.dataSources, "retrieve", async () => ({ id: "ds-1" } as any));
    t.mock.method(notion.dataSources, "query", async () => ({ results: [{ id: "existing-page" }] } as any));
    t.mock.method(notion.pages, "create", async () => {
        createCalls += 1;
        return {} as any;
    });
    t.mock.method(console, "info", (...args: any[]) => {
        infoMessages.push(args.map(String).join(" "));
    });

    await exportToNotion([makeCandidate(filePath)]);

    assert.equal(createCalls, 0);
    assert.ok(infoMessages.some((msg) => msg.includes("Skipping upload for")));
});

test("exportToNotion usa fallback search quando query falha e evita duplicata", async (t) => {
    installImmediateTimers(t);
    process.env.NOTION_ROOT_PAGE_ID = "db-root";

    const { exportToNotion, notion } = await loadNotionModule();
    const { filePath, hash } = await createTempFileWithHash("arquivo-unico-4");

    let searchCalls = 0;
    let createCalls = 0;
    const warnMessages: string[] = [];

    t.mock.method(notion.databases, "retrieve", async () => ({ data_sources: [{ id: "ds-1" }] } as any));
    t.mock.method(notion.dataSources, "retrieve", async () => ({ id: "ds-1" } as any));
    t.mock.method(notion.dataSources, "query", async () => {
        throw new Error("query indisponivel");
    });
    t.mock.method(notion, "search", async () => {
        searchCalls += 1;
        return {
            results: [
                {
                    object: "page",
                    properties: {
                        IdempotencyKey: {
                            rich_text: [{ plain_text: hash }],
                        },
                    },
                },
            ],
        } as any;
    });
    t.mock.method(notion.pages, "create", async () => {
        createCalls += 1;
        return {} as any;
    });
    t.mock.method(console, "warn", (...args: any[]) => {
        warnMessages.push(args.map(String).join(" "));
    });

    await exportToNotion([makeCandidate(filePath)]);

    assert.equal(searchCalls, 1);
    assert.equal(createCalls, 0);
    assert.ok(warnMessages.some((msg) => msg.includes("fallback via search")));
});

test("exportToNotion cria pagina quando fallback search nao encontra idempotency key", async (t) => {
    installImmediateTimers(t);
    process.env.NOTION_ROOT_PAGE_ID = "db-root";

    const { exportToNotion, notion } = await loadNotionModule();
    const { filePath } = await createTempFileWithHash("arquivo-unico-5");

    let createCalls = 0;

    t.mock.method(notion.databases, "retrieve", async () => ({ data_sources: [{ id: "ds-1" }] } as any));
    t.mock.method(notion.dataSources, "retrieve", async () => ({ id: "ds-1" } as any));
    t.mock.method(notion.dataSources, "query", async () => {
        throw new Error("query indisponivel");
    });
    t.mock.method(notion, "search", async () => ({
        results: [{ object: "page", properties: { IdempotencyKey: { rich_text: [{ plain_text: "outro-hash" }] } } }],
    } as any));
    t.mock.method(notion.pages, "create", async () => {
        createCalls += 1;
        return {} as any;
    });
    t.mock.method(console, "warn", () => {});

    await exportToNotion([makeCandidate(filePath)]);

    assert.equal(createCalls, 1);
});

test("exportToNotion reaplica pages.create com backoff exponencial em falha transiente", async (t) => {
    const delays: number[] = [];
    installImmediateTimers(t, delays);
    process.env.NOTION_ROOT_PAGE_ID = "db-root";

    const { exportToNotion, notion } = await loadNotionModule();
    const { filePath } = await createTempFileWithHash("arquivo-unico-6");

    let pageCreateAttempts = 0;

    t.mock.method(Math, "random", () => 0);
    t.mock.method(notion.databases, "retrieve", async () => ({ data_sources: [{ id: "ds-1" }] } as any));
    t.mock.method(notion.dataSources, "retrieve", async () => ({ id: "ds-1" } as any));
    t.mock.method(notion.dataSources, "query", async () => ({ results: [] } as any));
    t.mock.method(notion.pages, "create", async () => {
        pageCreateAttempts += 1;
        if (pageCreateAttempts < 3) {
            throw new Error("429 Too Many Requests");
        }
        return { id: "page-ok" } as any;
    });
    t.mock.method(console, "warn", () => {});

    await exportToNotion([makeCandidate(filePath)]);

    assert.equal(pageCreateAttempts, 3);
    assert.deepEqual(delays, [500, 1000]);
});

test("exportToNotion registra erro por candidato e continua com os proximos", async (t) => {
    installImmediateTimers(t);
    process.env.NOTION_ROOT_PAGE_ID = "db-root";

    const { exportToNotion, notion } = await loadNotionModule();
    const { filePath } = await createTempFileWithHash("arquivo-unico-7");

    const missingPath = join(tmpdir(), "arquivo-inexistente-repo2notion.txt");
    const errors: string[] = [];
    let createCalls = 0;

    t.mock.method(notion.databases, "retrieve", async () => ({ data_sources: [{ id: "ds-1" }] } as any));
    t.mock.method(notion.dataSources, "retrieve", async () => ({ id: "ds-1" } as any));
    t.mock.method(notion.dataSources, "query", async () => ({ results: [] } as any));
    t.mock.method(notion.pages, "create", async () => {
        createCalls += 1;
        return {} as any;
    });
    t.mock.method(console, "error", (...args: any[]) => {
        errors.push(args.map(String).join(" "));
    });

    await exportToNotion([makeCandidate(missingPath), makeCandidate(filePath)]);

    assert.equal(createCalls, 1);
    assert.ok(errors.some((msg) => msg.includes("Failed to create Notion page for")));
});
