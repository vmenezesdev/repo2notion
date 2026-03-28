import type { CreatePageParameters } from "@notionhq/client/build/src/api-endpoints";

/**
 * Notion API title block for property values.
 *
 * https://developers.notion.com/reference/property-value-object#title
 */
type NotionTitle = [{ text: { content: string } }];

/**
 * Notion API rich_text block for property values.
 *
 * https://developers.notion.com/reference/property-value-object#rich_text
 */
type NotionRichText = [{ text: { content: string } }];

/**
 * Notion file attachment variants:
 * - external: links to an external URL (not uploaded to Notion)
 * - file_upload: references a previously uploaded file via /v1/file_uploads
 */
type NotionFileAttachment =
	| { type: "external"; name: string; external: { url: string } }
	| { type: "file_upload"; name: string; file_upload: { id: string } };

/**
 * Tipos de propriedades do database do Notion usado neste repositório.
 * Mapear os campos conforme o schema observado no datasource.
 */
export type NotionMaterialProperties = {
	"Nome do Material": { title: NotionTitle };
	Tipo?: { select: { name: string } };
	Tags?: { multi_select: Array<{ name: string }> };
	URL?: { url: string };
	"Etapa de Curadoria"?: { select: { name: string } };
	"Data de Referência"?: { date: { start: string } };
	IdempotencyKey?: { rich_text: NotionRichText };
	"Aceito por"?: { people: Array<{ id: string }> };
	"Arquivos e mídia"?: { files: Array<NotionFileAttachment> };
};

export type CreateNotionMaterialPageParameters = Omit<
	CreatePageParameters,
	"parent" | "properties"
> & {
	parent: { data_source_id: string };
	properties: NotionMaterialProperties;
};

/**
 * Input amigável para criar uma página do tipo Material no Notion.
 *
 * Para ajustes futuros, mantenha os nomes dos campos de acordo com o database.
 */
export interface CreateNotionMaterialPageInput {
	dataSourceId: string;
	title: string;
	tipo?: string;
	tags?: string[];
	url?: string;
	etapaDeCuradoria?: string;
	dataReferencia?: Date | string;
	idempotencyKey?: string;
	aceitoPorUserIds?: string[];
	/** Pass `url` for external links or `fileUploadId` for files uploaded via /v1/file_uploads. */
	arquivosEMidia?: Array<{ name: string; url: string } | { name: string; fileUploadId: string }>;
}

/**
 * Build a strongly-typed Notion pages.create payload targeting the configured datasource.
 *
 * Use `notion.pages.create(payload)` with return type inferred from Notion SDK.
 *
 * Exemplo de uso:
 *
 * const payload = buildCreateNotionMaterialPageParams({
 *   dataSourceId: "d9824bdc-8445-4327-be8b-5b47500af6ce",
 *   title: "New Page Title",
 *   tags: ["Tag1","Tag2"],
 * });
 * await notion.pages.create(payload);
 */
export function buildCreateNotionMaterialPageParams(
	input: CreateNotionMaterialPageInput,
): CreateNotionMaterialPageParameters {
	const properties: NotionMaterialProperties = {
		"Nome do Material": {
			title: [{ text: { content: input.title } }],
		},
	};

	if (input.tipo) {
		properties.Tipo = { select: { name: input.tipo } };
	}

	if (input.tags?.length) {
		properties.Tags = {
			multi_select: input.tags.map((name) => ({ name })),
		};
	}

	if (input.url) {
		properties.URL = { url: input.url };
	}

	if (input.etapaDeCuradoria) {
		properties["Etapa de Curadoria"] = {
			select: { name: input.etapaDeCuradoria },
		};
	}

	if (input.dataReferencia) {
		properties["Data de Referência"] = {
			date: {
				start:
					input.dataReferencia instanceof Date
						? input.dataReferencia.toISOString()
						: input.dataReferencia,
			},
		};
	}

	if (input.idempotencyKey) {
		properties.IdempotencyKey = {
			rich_text: [{ text: { content: input.idempotencyKey } }],
		};
	}

	if (input.aceitoPorUserIds?.length) {
		properties["Aceito por"] = {
			people: input.aceitoPorUserIds.map((id) => ({ id })),
		};
	}

	if (input.arquivosEMidia?.length) {
		properties["Arquivos e mídia"] = {
			files: input.arquivosEMidia.map((file) =>
				"fileUploadId" in file
					? { type: "file_upload" as const, name: file.name, file_upload: { id: file.fileUploadId } }
					: { type: "external" as const, name: file.name, external: { url: file.url } },
			),
		};
	}

	return {
		parent: { data_source_id: input.dataSourceId },
		properties,
	};
}
