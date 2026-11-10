#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { logger } from "./lib/server/logger.js";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENTS_ROOT = join(PROJECT_ROOT, "contents");
const ADMIN_TOKEN = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN;

const argv = yargs(hideBin(process.argv))
    .option("path", {
        type: "string",
        default: "contents/single-document-texts",
        description: "Markdown file or directory to import, relative to the project root",
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
        description: "Delete rows whose source file no longer exists in the imported directory",
    })
    .parse();

const apiUrl = argv.url.replace(/\/+$/, "");
const importTarget = resolve(PROJECT_ROOT, argv.path);
const relativeImportTarget = relative(CONTENTS_ROOT, importTarget);

if (relativeImportTarget.startsWith("..")) {
    logger.error({ path: argv.path }, "Import path must be inside contents/");
    process.exit(1);
}

let targetStat;

try {
    targetStat = await stat(importTarget);
} catch (error) {
    logger.error({ path: argv.path, code: error.code }, "Import path does not exist");
    process.exit(1);
}

const isDirectory = targetStat.isDirectory();

if (!isDirectory && !targetStat.isFile()) {
    logger.error({ path: argv.path }, "Import path must be a Markdown file or a directory");
    process.exit(1);
}

if (!isDirectory && (!importTarget.endsWith(".md") || importTarget.endsWith(".dialogue.md"))) {
    logger.error({ path: argv.path }, "Import file must be a Markdown file, excluding *.dialogue.md");
    process.exit(1);
}

if (!isDirectory && argv.prune) {
    logger.error("--prune can only be used with a directory");
    process.exit(1);
}

if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 32) {
    logger.error("SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN is not set or is shorter than 32 characters");
    process.exit(1);
}

const firstSegment = relativeImportTarget.split(sep)[0];
const slugBase =
    firstSegment && (isDirectory || relativeImportTarget.includes(sep))
        ? join(CONTENTS_ROOT, firstSegment)
        : CONTENTS_ROOT;
const directoryRoot = isDirectory ? importTarget : dirname(importTarget);
const fileNames = isDirectory
    ? (await readdir(directoryRoot, { recursive: true }))
          .filter((fileName) => fileName.endsWith(".md") && !fileName.endsWith(".dialogue.md"))
          .sort()
    : [basename(importTarget)];

const relativeImportTargetPosix = relativeImportTarget.split(sep).join("/");
const importPrefix = relativeImportTargetPosix ? relativeImportTargetPosix + "/" : "";

if (argv.prune && importPrefix === "") {
    logger.error("--prune requires a directory inside contents/, not contents/ itself");
    process.exit(1);
}

if (argv.prune && fileNames.length === 0) {
    logger.error("Refusing to prune with an empty file list");
    process.exit(1);
}

const documents = await Promise.all(
    fileNames.map(async (fileName) => {
        const absolutePath = join(directoryRoot, fileName);
        const raw = await readFile(absolutePath);
        const { frontmatter, body } = parseMarkdown(raw.toString("utf8"));
        const relativeToSlugBase = relative(slugBase, absolutePath).split(sep).join("/");
        const relativeToContents = relative(CONTENTS_ROOT, absolutePath).split(sep).join("/");
        const slug = relativeToSlugBase.replace(/\.(?:fr\.)?md$/, "");

        return {
            slug,
            title: titleOf(frontmatter, body, slug),
            content: body,
            sourceUrl: normalizeSourceUrl(frontmatter.source_url),
            authors: normalizeAuthors(frontmatter.authors),
            originalPublishedDate: normalizeOriginalPublishedDate(frontmatter.original_published_date),
            markdownSourceFile: relativeToContents,
            markdownSourceFileHash: `sha256:${createHash("sha256").update(raw).digest("hex")}`,
            // Rough estimate: four characters per token, frontmatter excluded.
            markdownSourceFileEstimateTokenCount: Math.ceil(body.length / 4),
            metadata: frontmatter,
        };
    }),
);

logger.info(
    { path: argv.path, kind: isDirectory ? "directory" : "file", files: documents.length },
    "Parsed Markdown files",
);

const counts = { inserted: 0, updated: 0, unchanged: 0, deleted: 0 };

try {
    for (const document of documents) {
        const action = await syncDocument(document);
        counts[action] += 1;
        logger.info({ file: document.markdownSourceFile, action }, "Imported");
    }

    if (argv.prune) {
        const result = await pruneContent();
        counts.deleted = result.deleted;
        logger.info({ deleted: result.deleted, deleted_paths: result.deleted_paths }, "Pruned");
    }
} catch (error) {
    logger.error({ err: error }, "Content import failed");
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
        kind: isDirectory ? "directory" : "file",
        files: documents.length,
        inserted: counts.inserted,
        updated: counts.updated,
        unchanged: counts.unchanged,
        deleted: counts.deleted,
        reindexed: reindex !== null,
    },
    "Content import done",
);

async function syncDocument(document) {
    const result = await sendSyncRequest({
        upsert: [toApiDocument(document)],
        dry_run: argv.dryRun,
    });

    return result.items[0].action;
}

async function pruneContent() {
    return await sendSyncRequest({
        prune: {
            scope: importPrefix,
            keep: documents.map((document) => document.markdownSourceFile),
        },
        dry_run: argv.dryRun,
    });
}

async function sendSyncRequest(payload) {
    const response = await fetch(`${apiUrl}/api/v1/admin/hierarchical-content-nodes/sync`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${ADMIN_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

function toApiDocument(document) {
    return {
        slug: document.slug,
        title: document.title,
        content: document.content,
        source_url: document.sourceUrl,
        authors: document.authors,
        original_published_date: document.originalPublishedDate,
        markdown_source_file: document.markdownSourceFile,
        markdown_source_file_hash: document.markdownSourceFileHash,
        markdown_source_file_estimate_token_count: document.markdownSourceFileEstimateTokenCount,
        metadata: document.metadata,
    };
}

function parseMarkdown(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

    if (!match) {
        return { frontmatter: {}, body: text };
    }

    const parsed = yaml.load(match[1]);
    const frontmatter = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};

    return { frontmatter, body: text.slice(match[0].length) };
}

function normalizeSourceUrl(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
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

function titleOf(frontmatter, body, fallback) {
    if (typeof frontmatter.video_title === "string" && frontmatter.video_title.trim()) {
        return frontmatter.video_title.trim();
    }

    const heading = body.match(/^#\s+(.+?)\s*$/m);

    return heading ? heading[1].trim() : fallback;
}
