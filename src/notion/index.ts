import { Client } from "@notionhq/client";
import { RecordCandidateWithRefinedMetadata } from "../types";
import { buildCreateNotionMaterialPageParams } from "./type";
import { uploadFileToNotion, MAX_FILE_SIZE_BYTES } from "./upload";
import { sleep } from "./rate-limit";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const createdIdempotencyKeys = new Set<string>();

// Notion rate limit: 3 req/s (we stay at 2 to be safe).
const MAX_REQUESTS_PER_SECOND = 2;
const MIN_REQUEST_INTERVAL_MS = 1000 / MAX_REQUESTS_PER_SECOND;
let lastRequestTime = 0;

async function ensureRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - elapsed);
    if (wait > 0) {
        await sleep(wait);
    }
    lastRequestTime = Date.now();
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 5): Promise<T> {
    let attempt = 0;
    const baseDelay = 500;
    while (true) {
        try {
            await ensureRateLimit();
            return await fn();
        } catch (error) {
            attempt += 1;
            if (attempt >= maxAttempts) {
                throw error;
            }
            const jitter = Math.random() * 200;
            const delay = baseDelay * 2 ** (attempt - 1) + jitter;
            console.warn(`Attempt ${attempt} failed, retry in ${Math.round(delay)}ms`, error);
            await sleep(delay);
        }
    }
}

async function computeFileHash(filePath: string): Promise<string> {
    const content = await readFile(filePath);
    return createHash("sha256").update(content).digest("hex");
}

async function isPageAlreadyUploaded(dataSourceId: string, idempotencyKey: string): Promise<boolean> {
    if (createdIdempotencyKeys.has(idempotencyKey)) {
        return true;
    }

    try {
        const result = await withRetry(() =>
            notion.dataSources.query({
                data_source_id: dataSourceId,
                filter: {
                    property: "IdempotencyKey",
                    rich_text: {
                        equals: idempotencyKey,
                    },
                },
                page_size: 1,
            }),
        );

        const found = Array.isArray(result.results) && result.results.length > 0;
        if (found) {
            createdIdempotencyKeys.add(idempotencyKey);
        }

        return found;
    } catch (error) {
        console.warn("DataSources.query fallback via search devido a erro:", error);

        const searchResult = await notion.search({
            query: idempotencyKey,
            filter: { property: "object", value: "page" },
        });

        if (!searchResult || !Array.isArray(searchResult.results)) {
            return false;
        }

        const foundBySearch = searchResult.results.some((item: any) => {
            if (item?.object !== "page" || !item.properties) return false;
            const idempotencyProperty = item.properties["IdempotencyKey"];
            if (!idempotencyProperty || !Array.isArray(idempotencyProperty.rich_text)) return false;
            return idempotencyProperty.rich_text.some((block: any) => {
                const plainText = block?.plain_text || block?.text?.content;
                return plainText === idempotencyKey;
            });
        });

        if (foundBySearch) {
            createdIdempotencyKeys.add(idempotencyKey);
        }

        return foundBySearch;
    }
}

/**
 * Transforma candidatos anotados em páginas no Notion.
 *
 * Para cada candidato:
 * 1. Computa o hash SHA-256 do arquivo como idempotency key.
 * 2. Verifica duplicidade no datasource antes de criar.
 * 3. Tenta fazer upload do arquivo via /v1/file_uploads (graceful degradation:
 *    se falhar, cria a página sem anexo).
 * 4. Cria a página com os metadados e o anexo (quando disponível).
 *
 * Todas as chamadas à API passam por `withRetry`, que aplica rate limiting
 * (2 req/s) e backoff exponencial em falhas transitórias.
 *
 * Retorna a lista de candidatos cujos arquivos excedem o limite de 20 MB do
 * Notion e foram, portanto, criados como páginas sem anexo.
 */
export async function exportToNotion(
    pageCandidates: RecordCandidateWithRefinedMetadata[],
): Promise<RecordCandidateWithRefinedMetadata[]> {
    // Reset rate-limit state so accumulated test runs (or prior invocations) don't
    // cause spurious sleeps. Each export run starts its own fresh 2 req/s window.
    lastRequestTime = 0;

    const datasource = await getDatasource();
    const datasourceId = datasource?.id;

    if (!datasourceId) {
        console.error("No data source found in Notion database");
        return [];
    }

    const oversizedCandidates: RecordCandidateWithRefinedMetadata[] = [];

    for (const candidate of pageCandidates) {
        try {
            const idempotencyKey = await computeFileHash(candidate.sourcePath);

            const exists = await isPageAlreadyUploaded(datasourceId, idempotencyKey);
            if (exists) {
                console.info(`Skipping upload for ${candidate.sourcePath}: idempotency key already exists.`);
                continue;
            }

            // Check file size before attempting upload.
            let arquivosEMidia: Array<{ name: string; fileUploadId: string }> | undefined;
            const fileStat = await stat(candidate.sourcePath);
            if (fileStat.size > MAX_FILE_SIZE_BYTES) {
                console.warn(
                    `File upload skipped for ${candidate.sourcePath} — ${(fileStat.size / 1024 / 1024).toFixed(1)} MB exceeds the 20 MB Notion limit. Page will be created without attachment.`,
                );
                oversizedCandidates.push(candidate);
            } else {
                try {
                    const uploaded = await uploadFileToNotion(candidate.sourcePath, ensureRateLimit);
                    arquivosEMidia = [{ name: uploaded.filename, fileUploadId: uploaded.fileUploadId }];
                } catch (uploadError) {
                    console.warn(
                        `File upload skipped for ${candidate.sourcePath} — page will be created without attachment:`,
                        uploadError,
                    );
                }
            }

            const payload = buildCreateNotionMaterialPageParams({
                dataSourceId: datasourceId,
                title: candidate.title,
                tipo: candidate.tipo,
                tags: candidate.tags,
                url: candidate.url,
                idempotencyKey,
                arquivosEMidia,
            });

            await withRetry(() => notion.pages.create(payload));
            createdIdempotencyKeys.add(idempotencyKey);
        } catch (error) {
            console.error(`Failed to create Notion page for ${candidate.sourcePath}:`, error);
        }
    }

    return oversizedCandidates;
}

export async function getDatasource() {
    const databaseId = process.env.NOTION_ROOT_PAGE_ID;

    const response = await notion.databases.retrieve({ database_id: databaseId! });

    if ("data_sources" in response) {
        const dataSourceIds = response.data_sources;
        const firstDataSourceId = dataSourceIds[0];
        if (!firstDataSourceId) {
            return null; // No data sources found
        }
        const dataSource = await notion.dataSources.retrieve({ data_source_id: firstDataSourceId.id });
        if (!dataSource) {
            return null; // Data source not found
        }
        return dataSource;
    }
}


export { notion };
