# repo2notion

A simple Node.js tool to migrate a file-based repository into a Notion database.

Built to move large content archives misplaced in git repositories into Notion, where they can be better organized and easily accessed.

## Why

Using Git as a content archive can quickly become unwieldy:
- poor navigation for non-developers
- difficult discovery of files
- no structured metadata
- friction to consume and share content

`repo2notion` solves this by transforming a reposityry into a Notion database, where content becomes easier to browse, search, and share.

## What it does
- Traverses a local repository (folders and files)
- Maps folders -> Notion pages
- Converts structure into a Notion database with hierarchical pages
- Uploads files as attachments to Notion database entries
- Links back to original files in the repository for reference
- Creates a clean, human-readble content index

## Use case

Originally built to migrate an academic archive:

`CAECOMP/provas -> Notion workspace`

But the approach works for any repo used as:
- knowledge base
- document archive
- study materials
- internal resources

## Scope

This is a one-time migration tool, not a sync engine.
- No continuous sync
- No bidirectional updates
- No Git <-> Notion mirroring

If you need sync, this is not the right tool.

## How it works
High level pipeline:
`scan repo -> build index -> transform -> push to Notion`

Core steps:
1. Read directory strucutre
2. Normalize file/folder names
3. Create a flat index of content with metadata in place of nested folders
4 Create Notion database entries for each content item
5. Upload files as attachments and link to original repo paths

## Tech Stack
- Node.js / TypeScript
- Notion SDK (`notionhq/client`)

## Setup
### 1. Create a Notion integration
- Go to [Notion Integrations](https://www.notion.com/my-integrations)
- Create an internal integration
- Copy the API key

### 2. Share your target database/page with the integration
Share the root Notion page/database with your integration

### 3. Configure environment
`cp .env.example .env`
```
NOTION_API_KEY=<your-notion-api-key>
NOTION_ROOT_PAGE_ID=<notion-root-page-id>
SCORE_THRESHOLD=80
AI_SCORE_THRESHOLD=80
REFINE_BATCH_SIZE=20
```

- `SCORE_THRESHOLD` define o corte entre candidatos bons e não classificados (1-100, padrão: 80)
- `AI_SCORE_THRESHOLD` define o corte para chamar IA no refine (somente score abaixo do valor; padrão: usa `SCORE_THRESHOLD` ou 80)
- `REFINE_BATCH_SIZE` controla quantos arquivos são refinados em paralelo por lote (padrão: 20 em repositórios grandes, 40 nos demais)

### 4. Install and run

```
npm install
npm run dev
```

## Limitations
- Notion API rate limits (~requests per second)
- File size limits for uploads (5MB for free accounts, 100MB for paid)

## Intermediate outputs
Durante a execução o pipeline gera arquivos intermediários para auditoria local:
- `repoTree.json`
- `files.json`
- `recordCandidates.json`
- `goodCandidates.json`
- `badCandidates.json`
- `uncategorizedCandidates.json`

## Contributing
Contributions welcome! Open an issue or submit a pull request.

## Philosophy
> Git is great for versioning.
> Not always for consumption.

## License
MIT License