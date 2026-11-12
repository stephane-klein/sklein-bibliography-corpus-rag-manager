#!/usr/bin/env node
import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { discoverBooks, loadBook } from "#lib/server/book-loader.js";
import { buildBookTree } from "#lib/server/book-tree.js";
import { buildChunkSyncPayload, hasEmbeddingSidecar, readEmbeddingSidecar } from "#lib/server/embedding-import.js";
import { logger } from "./lib/server/logger.js";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENTS_ROOT = join(PROJECT_ROOT, "contents");
const BOOKS_ROOT = join(CONTENTS_ROOT, "books");
const ADMIN_TOKEN = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN;
const MAX_UPSERT_ITEMS = 500;

const argv = yargs(hideBin(process.argv))
    .option("path", {
        type: "string",
        default: "contents/books",
        description: "Book directory, or a directory containing book directories, relative to the project root",
    })
    .option("url", {
        type: "string",
        default: process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_API_URL || "http://localhost:5173",
        description: "Base URL of the webapp",
    })
    .option("dry-run", {
        type: "boolean",
        default: false,
        description: "Report changes without writing to the database",
    })
    .option("prune", {
        type: "boolean",
        default: false,
        description: "Delete book nodes whose slug is no longer in the imported tree",
    })
    .option("skip-embeddings", {
        type: "boolean",
        default: false,
        description: "Import book nodes only, without their chunk embeddings",
    })
    .option("require-embeddings", {
        type: "boolean",
        default: false,
        description: "Fail when a book section has no embedding sidecar",
    })
    .parse();

const apiUrl = argv.url.replace(/\/+$/, "");
const importTarget = resolve(PROJECT_ROOT, argv.path);
const relativeImportTarget = relative(BOOKS_ROOT, importTarget);

if (relativeImportTarget.startsWith("..")) {
    logger.error({ path: argv.path }, "Import path must be inside contents/books/");
    process.exit(1);
}

let targetStat;

try {
    targetStat = await stat(importTarget);
} catch (error) {
    logger.error({ path: argv.path, code: error.code }, "Import path does not exist");
    process.exit(1);
}

if (!targetStat.isDirectory()) {
    logger.error({ path: argv.path }, "Import path must be a book directory");
    process.exit(1);
}

if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 32) {
    logger.error("SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN is not set or is shorter than 32 characters");
    process.exit(1);
}

if (argv.skipEmbeddings && argv.requireEmbeddings) {
    logger.error("--skip-embeddings and --require-embeddings are mutually exclusive");
    process.exit(1);
}

const books = await discoverBooks(importTarget);

logger.info({ path: argv.path, books: books.length }, "Discovered books");

const counts = {
    books: 0,
    nodes: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    deleted: 0,
    embeddingsImported: 0,
    embeddingsUnchanged: 0,
    embeddingsMissing: 0,
    chunks: 0,
};

try {
    for (const bookDir of books) {
        const { config, nodes, result, embeddings } = await importBook(bookDir);

        counts.books += 1;
        counts.nodes += nodes.length;
        counts.inserted += result.inserted;
        counts.updated += result.updated;
        counts.unchanged += result.unchanged;
        counts.deleted += result.deleted;
        counts.embeddingsImported += embeddings.imported;
        counts.embeddingsUnchanged += embeddings.unchanged;
        counts.embeddingsMissing += embeddings.missing;
        counts.chunks += embeddings.chunks;

        logger.info(
            {
                book: relative(PROJECT_ROOT, bookDir),
                slug: config.slug,
                nodes: nodes.length,
                inserted: result.inserted,
                updated: result.updated,
                unchanged: result.unchanged,
                deleted: result.deleted,
                deleted_slugs: result.deleted_slugs,
                embeddings_imported: embeddings.imported,
                embeddings_unchanged: embeddings.unchanged,
                embeddings_missing: embeddings.missing,
                chunks: embeddings.chunks,
            },
            "Imported book",
        );
    }
} catch (error) {
    logger.error({ err: error }, "Book import failed");
    process.exit(1);
}

let reindex = null;

if (!argv.dryRun && counts.inserted + counts.updated + counts.deleted > 0) {
    try {
        reindex = await reindexIndex();
        logger.info({ ...reindex }, "BM25 index reindexed");
    } catch (error) {
        logger.warn(
            { err: error },
            "BM25 index reindex failed; search stays slow until REINDEX INDEX CONCURRENTLY idx_hierarchical_content_nodes_bm25 succeeds",
        );
    }
}

logger.info(
    {
        path: argv.path,
        books: counts.books,
        nodes: counts.nodes,
        inserted: counts.inserted,
        updated: counts.updated,
        unchanged: counts.unchanged,
        deleted: counts.deleted,
        embeddings_imported: counts.embeddingsImported,
        embeddings_unchanged: counts.embeddingsUnchanged,
        embeddings_missing: counts.embeddingsMissing,
        chunks: counts.chunks,
        reindexed: reindex !== null,
    },
    "Book import done",
);

async function importBook(bookDir) {
    const { config, toc, filesByPath, bookDirName } = await loadBook(bookDir);
    const nodes = buildBookTree({ toc, config, filesByPath });

    if (nodes.length > MAX_UPSERT_ITEMS) {
        throw new Error(
            `Book ${config.slug} has ${nodes.length} nodes, more than the ${MAX_UPSERT_ITEMS} accepted in one sync request`,
        );
    }

    const payload = {
        upsert: nodes.map((node) => toApiDocument({ node, config, bookDirName })),
        dry_run: argv.dryRun,
    };

    if (argv.prune) {
        payload.prune = {
            scope_slug: config.slug,
            keep_slugs: nodes.map((node) => node.slug),
        };
    }

    const result = await sendSyncRequest("/api/v1/admin/hierarchical-content-nodes/sync", payload);
    const embeddings = await importBookEmbeddings({ nodes, bookDir, bookDirName });

    return { config, nodes, result, embeddings };
}

async function importBookEmbeddings({ nodes, bookDir, bookDirName }) {
    const counts = { imported: 0, unchanged: 0, missing: 0, chunks: 0 };

    if (argv.skipEmbeddings) {
        return counts;
    }

    for (const node of nodes.filter((node) => node.file)) {
        const sourceFile = `books/${bookDirName}/markdown/${node.file.relativePath}`;
        const absolutePath = join(bookDir, "markdown", node.file.relativePath);

        if (!(await hasEmbeddingSidecar(absolutePath))) {
            if (argv.requireEmbeddings) {
                throw new Error(
                    `Embeddings sidecar is missing for ${sourceFile}; run generate-sidecars and generate-embeddings first`,
                );
            }

            counts.missing += 1;
            logger.warn({ file: sourceFile }, "Embeddings sidecar missing");
            continue;
        }

        const sourceFileHash = `sha256:${createHash("sha256").update(node.file.raw).digest("hex")}`;
        const { manifest, chunks, embeddings } = await readEmbeddingSidecar(absolutePath, sourceFile, sourceFileHash);

        if (argv.dryRun) {
            counts.imported += 1;
            counts.chunks += chunks.length;
            logger.info({ file: sourceFile, chunks: chunks.length }, "Book chunks would be imported");
            continue;
        }

        const result = await sendSyncRequest(
            "/api/v1/admin/hierarchical-content-chunks/sync",
            buildChunkSyncPayload({ manifest, chunks, embeddings, dryRun: false }),
        );

        if (result.unchanged) {
            counts.unchanged += 1;
        } else {
            counts.imported += 1;
            counts.chunks += result.inserted;
        }

        logger.info({ file: sourceFile, chunks: chunks.length, unchanged: result.unchanged }, "Imported book chunks");
    }

    return counts;
}

function toApiDocument({ node, config, bookDirName }) {
    const bibliography = config.bibliography ?? {};
    const file = node.file;

    return {
        slug: node.slug,
        parent_slug: node.parent_slug,
        depth: node.depth,
        position: node.position,
        title: node.title,
        content: node.content,
        source_url: null,
        source_kind: bibliography.source_kind ?? null,
        language: bibliography.language ?? "en",
        authors: normalizeAuthors(bibliography.authors),
        original_published_date: normalizeOriginalPublishedDate(bibliography.original_published_date),
        markdown_source_file: file ? `books/${bookDirName}/markdown/${file.relativePath}` : null,
        markdown_source_file_hash: file ? `sha256:${createHash("sha256").update(file.raw).digest("hex")}` : null,
        markdown_source_file_estimate_token_count: file ? Math.ceil(file.body.length / 4) : 0,
        metadata: node.metadata,
    };
}

async function sendSyncRequest(path, payload) {
    const response = await fetch(`${apiUrl}${path}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${ADMIN_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(180_000),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(result?.detail || `HTTP ${response.status} from ${apiUrl}`);
    }

    return result.data;
}

async function reindexIndex() {
    const response = await fetch(`${apiUrl}/api/v1/admin/hierarchical-content-nodes/reindex`, {
        method: "POST",
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(result?.detail || `HTTP ${response.status} from ${apiUrl}`);
    }

    return result.data;
}

function normalizeAuthors(value) {
    if (Array.isArray(value)) {
        return value.filter((author) => typeof author === "string" && author.trim()).map((author) => author.trim());
    }

    return typeof value === "string" && value.trim() ? [value.trim()] : [];
}

function normalizeOriginalPublishedDate(value) {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    if (Number.isInteger(value)) {
        return String(value);
    }

    return null;
}
