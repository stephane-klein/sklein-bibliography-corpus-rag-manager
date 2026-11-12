#!/usr/bin/env node
import { createHash } from "node:crypto";
import { access, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { readEmbeddingsFile, writeEmbeddingsFile } from "./lib/server/embeddings-file.js";
import { logger } from "./lib/server/logger.js";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENTS_ROOT = join(PROJECT_ROOT, "contents");
const ALLOWED_ROOTS = [join(CONTENTS_ROOT, "single-document-texts"), join(CONTENTS_ROOT, "books")];
const DEFAULT_PATH = "contents/single-document-texts";
const ADMIN_TOKEN = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN;
const EMBEDDING_INPUT_FORMAT = "heading_path_text_v1";
const EMBEDDING_INPUT_TYPE = "document";
const EMBEDDING_STRATEGY = "standard";
const EMBEDDING_FORMAT = "float32le";
const EMBEDDING_FORMAT_VERSION = 1;
const COST_BASIS = "list_price";
const MAX_TEXTS_PER_REQUEST = 128;
const MAX_CHARS_PER_REQUEST = 200_000;

const argv = yargs(hideBin(process.argv))
    .option("path", {
        type: "string",
        default: DEFAULT_PATH,
        description: "Markdown file or directory under contents/single-document-texts or contents/books",
    })
    .option("url", {
        type: "string",
        default: process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_API_URL || "http://localhost:5173",
        description: "Base URL of the webapp",
    })
    .option("dry-run", {
        type: "boolean",
        default: false,
        description: "Report what would be embedded without generating vectors",
    })
    .option("force", {
        type: "boolean",
        default: false,
        description: "Regenerate embeddings even when they match",
    })
    .parse();

const apiUrl = argv.url.replace(/\/+$/, "");
const importTarget = resolve(PROJECT_ROOT, argv.path);
const insideAllowedRoot = ALLOWED_ROOTS.some((root) => {
    const relativeToRoot = relative(root, importTarget);

    return (
        relativeToRoot === "" ||
        (relativeToRoot !== ".." && !relativeToRoot.startsWith(`..${sep}`) && !isAbsolute(relativeToRoot))
    );
});

if (!insideAllowedRoot) {
    logger.error({ path: argv.path }, "Path must be inside contents/single-document-texts or contents/books");
    process.exit(1);
}

if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 32) {
    logger.error("SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN is not set or is shorter than 32 characters");
    process.exit(1);
}

let targetStat;

try {
    targetStat = await stat(importTarget);
} catch (error) {
    logger.error({ path: argv.path, code: error.code }, "Path does not exist");
    process.exit(1);
}

const isDirectory = targetStat.isDirectory();

if (!isDirectory && !targetStat.isFile()) {
    logger.error({ path: argv.path }, "Path must be a Markdown file or a directory");
    process.exit(1);
}

if (!isDirectory && (!importTarget.endsWith(".md") || importTarget.endsWith(".dialogue.md"))) {
    logger.error({ path: argv.path }, "File must be a Markdown file, excluding *.dialogue.md");
    process.exit(1);
}

const directoryRoot = isDirectory ? importTarget : dirname(importTarget);
const sidecarPaths = isDirectory
    ? (await readdir(directoryRoot, { recursive: true }))
          .filter((fileName) => fileName.endsWith(".md.yaml"))
          .sort()
          .map((fileName) => join(directoryRoot, fileName))
    : [`${importTarget}.yaml`];

if (sidecarPaths.length === 0) {
    logger.error({ path: argv.path }, "No sidecar files found; run generate-sidecars first");
    process.exit(1);
}

if (!isDirectory) {
    try {
        await access(sidecarPaths[0]);
    } catch {
        logger.error({ path: argv.path }, "Sidecar not found; run generate-sidecars first");
        process.exit(1);
    }
}

logger.info(
    { path: argv.path, kind: isDirectory ? "directory" : "file", files: sidecarPaths.length },
    "Found sidecar files",
);

let info;

try {
    info = await fetchEmbeddingInfo();
} catch (error) {
    logger.error({ err: error }, "Could not read the embedding configuration");
    process.exit(1);
}

logger.info(
    { provider: info.provider, model: info.model, query_model: info.query_model, dimension: info.dimension },
    "Embedding configuration",
);

const counts = { embedded: 0, skipped: 0, chunks: 0, tokens: 0, costUsd: 0, pricedFiles: 0, unpricedFiles: 0 };

try {
    for (const sidecarPath of sidecarPaths) {
        const sourcePath = sidecarPath.replace(/\.yaml$/, "");

        if (!sourcePath.endsWith(".md")) {
            throw new Error(`Sidecar is not next to a Markdown file: ${sidecarPath}`);
        }

        const relativeToContents = relative(CONTENTS_ROOT, sourcePath).split(sep).join("/");

        try {
            await access(sidecarPath);
        } catch {
            throw new Error(`Sidecar not found: ${relativeToContents}.yaml; run generate-sidecars first`);
        }

        const document = yaml.load(await readFile(sidecarPath, "utf8"));
        const { manifest, chunks } = validateSidecar(document, sourcePath);
        const sourceHash = `sha256:${createHash("sha256")
            .update(await readFile(sourcePath))
            .digest("hex")}`;

        if (manifest.source_file_hash !== sourceHash) {
            throw new Error(`Sidecar is stale for ${relativeToContents}; run generate-sidecars first`);
        }

        if (!argv.force && (await isCurrent(manifest, chunks, info, sourcePath))) {
            counts.skipped += 1;
            logger.info({ file: relativeToContents, chunks: chunks.length }, "Sidecar embeddings unchanged");
            continue;
        }

        if (argv.dryRun) {
            counts.embedded += 1;
            counts.chunks += chunks.length;
            logger.info({ file: relativeToContents, chunks: chunks.length }, "Sidecar embeddings would be generated");
            continue;
        }

        const { embeddings, tokens, costUsd, costBasis, pricePerMillionTokensUsd } = await embedChunks(chunks);
        const binaryName = `${basename(sourcePath)}.embeddings.bin`;
        const binaryPath = join(dirname(sourcePath), binaryName);
        const header = {
            format: EMBEDDING_FORMAT,
            format_version: EMBEDDING_FORMAT_VERSION,
            provider: info.provider,
            model: info.model,
            dimension: info.dimension,
            chunk_count: chunks.length,
            source_file_hash: manifest.source_file_hash,
            input_format: EMBEDDING_INPUT_FORMAT,
            input_type: EMBEDDING_INPUT_TYPE,
            strategy: EMBEDDING_STRATEGY,
            cost:
                costUsd === null
                    ? null
                    : {
                          amount_usd: costUsd,
                          basis: costBasis,
                          tokens,
                          price_per_million_tokens_usd: pricePerMillionTokensUsd,
                      },
        };

        await writeEmbeddingsFile(binaryPath, { header, embeddings });
        await verifyWrittenEmbeddings(binaryPath, header, chunks.length);

        manifest.embedding_provider = info.provider;
        manifest.embedding_model = info.model;
        manifest.dimension = info.dimension;
        manifest.embedding_file = binaryName;
        manifest.embedding_format = EMBEDDING_FORMAT;
        manifest.embedding_input_format = EMBEDDING_INPUT_FORMAT;
        manifest.embedding_input_type = EMBEDDING_INPUT_TYPE;
        manifest.embedding_strategy = EMBEDDING_STRATEGY;
        await writeSidecar(sidecarPath, { manifest, chunks });

        counts.embedded += 1;
        counts.chunks += chunks.length;
        counts.tokens += tokens;

        if (costUsd === null) {
            counts.unpricedFiles += 1;
        } else {
            counts.costUsd += costUsd;
            counts.pricedFiles += 1;
        }

        logger.info(
            {
                file: relativeToContents,
                sidecar: `${relativeToContents}.yaml`,
                embeddings: binaryName,
                chunks: chunks.length,
                tokens,
                cost_usd: costUsd,
                cost_basis: costBasis,
                model: info.model,
                dimension: info.dimension,
            },
            "Sidecar embeddings generated",
        );
    }
} catch (error) {
    logger.error({ err: error }, "Embedding generation failed");
    process.exit(1);
}

const totalCostUsd = argv.dryRun
    ? null
    : counts.pricedFiles === 0 && counts.unpricedFiles > 0
      ? null
      : roundUsd(counts.costUsd);

logger.info(
    {
        path: argv.path,
        kind: isDirectory ? "directory" : "file",
        files: sidecarPaths.length,
        embedded: counts.embedded,
        skipped: counts.skipped,
        chunks: counts.chunks,
        tokens: counts.tokens,
        cost_usd: totalCostUsd,
        cost_currency: "USD",
        cost_basis: COST_BASIS,
        cost_partial: !argv.dryRun && counts.unpricedFiles > 0,
        dry_run: argv.dryRun,
        forced: argv.force,
    },
    "Embedding generation done",
);

async function embedChunks(chunks) {
    const embeddings = [];
    let tokens = 0;
    let costUsd = 0;
    let costPriced = true;
    let costBasis = COST_BASIS;
    let pricePerMillionTokensUsd = null;

    for (const batch of splitEmbeddingInputs(chunks.map((chunk) => `${chunk.heading_path}\n\n${chunk.text}`))) {
        const data = await requestEmbeddings(batch);

        if (data.provider !== info.provider || data.model !== info.model || data.dimension !== info.dimension) {
            throw new Error(
                `Webapp returned ${data.provider}/${data.model}/${data.dimension}, expected ${info.provider}/${info.model}/${info.dimension}`,
            );
        }

        if (!Array.isArray(data.embeddings) || data.embeddings.length !== batch.length) {
            throw new Error(`Webapp returned ${data.embeddings?.length ?? 0} vectors for ${batch.length} texts`);
        }

        embeddings.push(...data.embeddings);
        tokens += data.usage?.tokens ?? 0;

        if (typeof data.usage?.cost_usd === "number") {
            costUsd += data.usage.cost_usd;
        } else {
            costPriced = false;
        }

        if (typeof data.usage?.cost_basis === "string" && data.usage.cost_basis.trim()) {
            costBasis = data.usage.cost_basis;
        }

        if (typeof data.usage?.price_per_million_tokens_usd === "number") {
            pricePerMillionTokensUsd = data.usage.price_per_million_tokens_usd;
        }
    }

    if (embeddings.length !== chunks.length) {
        throw new Error(`Webapp returned ${embeddings.length} vectors for ${chunks.length} chunks`);
    }

    return {
        embeddings,
        tokens,
        costUsd: costPriced && pricePerMillionTokensUsd !== null ? roundUsd(costUsd) : null,
        costBasis,
        pricePerMillionTokensUsd,
    };
}

function splitEmbeddingInputs(texts) {
    const batches = [];
    let current = [];
    let currentChars = 0;

    for (const text of texts) {
        if (text.length > MAX_CHARS_PER_REQUEST) {
            throw new Error(`Embedding input exceeds ${MAX_CHARS_PER_REQUEST} characters`);
        }

        const batchIsFull =
            current.length >= MAX_TEXTS_PER_REQUEST || currentChars + text.length > MAX_CHARS_PER_REQUEST;

        if (current.length > 0 && batchIsFull) {
            batches.push(current);
            current = [];
            currentChars = 0;
        }

        current.push(text);
        currentChars += text.length;
    }

    if (current.length > 0) {
        batches.push(current);
    }

    return batches;
}

async function isCurrent(manifest, chunks, info, sourcePath) {
    if (manifest.embedding_provider !== info.provider) {
        return false;
    }

    if (manifest.embedding_model !== info.model || manifest.dimension !== info.dimension) {
        return false;
    }

    if (
        manifest.embedding_input_format !== EMBEDDING_INPUT_FORMAT ||
        manifest.embedding_input_type !== EMBEDDING_INPUT_TYPE ||
        manifest.embedding_strategy !== EMBEDDING_STRATEGY
    ) {
        return false;
    }

    if (manifest.embedding_format !== EMBEDDING_FORMAT) {
        return false;
    }

    if (typeof manifest.embedding_file !== "string" || basename(manifest.embedding_file) !== manifest.embedding_file) {
        return false;
    }

    try {
        const { header, embeddings } = await readEmbeddingsFile(join(dirname(sourcePath), manifest.embedding_file));

        return (
            header.format === EMBEDDING_FORMAT &&
            header.format_version === EMBEDDING_FORMAT_VERSION &&
            header.provider === info.provider &&
            header.model === info.model &&
            header.dimension === info.dimension &&
            header.chunk_count === chunks.length &&
            header.source_file_hash === manifest.source_file_hash &&
            header.input_format === EMBEDDING_INPUT_FORMAT &&
            header.input_type === EMBEDDING_INPUT_TYPE &&
            header.strategy === EMBEDDING_STRATEGY &&
            embeddings.length === chunks.length
        );
    } catch {
        return false;
    }
}

async function verifyWrittenEmbeddings(binaryPath, header, chunkCount) {
    const { header: writtenHeader, embeddings } = await readEmbeddingsFile(binaryPath);

    if (
        writtenHeader.provider !== header.provider ||
        writtenHeader.model !== header.model ||
        writtenHeader.dimension !== header.dimension ||
        writtenHeader.chunk_count !== header.chunk_count ||
        writtenHeader.source_file_hash !== header.source_file_hash ||
        writtenHeader.input_format !== header.input_format ||
        writtenHeader.input_type !== header.input_type ||
        writtenHeader.strategy !== header.strategy ||
        writtenHeader.cost?.amount_usd !== header.cost?.amount_usd ||
        writtenHeader.cost?.tokens !== header.cost?.tokens ||
        embeddings.length !== chunkCount
    ) {
        throw new Error(`Written embeddings file does not match its header: ${binaryPath}`);
    }
}

function roundUsd(value) {
    return Math.round(value * 1e9) / 1e9;
}

function validateSidecar(document, sourcePath) {
    if (!document || typeof document !== "object" || Array.isArray(document)) {
        throw new Error(`Sidecar must be a YAML object: ${sourcePath}`);
    }

    const { manifest, chunks } = document;

    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
        throw new Error(`Sidecar has no manifest: ${sourcePath}`);
    }

    if (!Array.isArray(chunks)) {
        throw new Error(`Sidecar has no chunks list: ${sourcePath}`);
    }

    if (manifest.type !== "manifest") {
        throw new Error(`Sidecar manifest type must be "manifest": ${sourcePath}`);
    }

    if (manifest.schema_version !== 1) {
        throw new Error(`Sidecar schema_version must be 1: ${sourcePath}`);
    }

    const relativeToContents = relative(CONTENTS_ROOT, sourcePath).split(sep).join("/");

    if (manifest.source_file !== relativeToContents) {
        throw new Error(`Sidecar source_file must be ${relativeToContents}: ${sourcePath}`);
    }

    if (manifest.chunk_count !== chunks.length) {
        throw new Error(`Sidecar chunk_count is ${manifest.chunk_count}, but chunks has ${chunks.length} items`);
    }

    for (const [index, chunk] of chunks.entries()) {
        if (!chunk || typeof chunk !== "object" || Array.isArray(chunk)) {
            throw new Error(`Sidecar chunk ${index} must be an object: ${sourcePath}`);
        }

        if (chunk.chunk_index !== index) {
            throw new Error(`Sidecar chunk_index must be ${index}: ${sourcePath}`);
        }

        if (typeof chunk.heading_path !== "string" || !chunk.heading_path.trim()) {
            throw new Error(`Sidecar chunk ${index} has no heading_path: ${sourcePath}`);
        }

        if (typeof chunk.text !== "string" || !chunk.text.trim()) {
            throw new Error(`Sidecar chunk ${index} has no text: ${sourcePath}`);
        }
    }

    return { manifest, chunks };
}

async function fetchEmbeddingInfo() {
    const response = await fetch(`${apiUrl}/api/v1/admin/embeddings`, {
        method: "GET",
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        signal: AbortSignal.timeout(30_000),
    });
    const data = await parseResponse(response);

    if (
        typeof data.provider !== "string" ||
        typeof data.model !== "string" ||
        !Number.isInteger(data.dimension) ||
        data.dimension <= 0
    ) {
        throw new Error("Webapp returned an invalid embedding configuration");
    }

    return data;
}

async function requestEmbeddings(texts) {
    const response = await fetch(`${apiUrl}/api/v1/admin/embeddings`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${ADMIN_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ texts, input_type: EMBEDDING_INPUT_TYPE }),
        signal: AbortSignal.timeout(180_000),
    });

    return await parseResponse(response);
}

async function parseResponse(response) {
    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(result?.detail || `HTTP ${response.status} from ${response.url}`);
    }

    if (!result?.data) {
        throw new Error(`Invalid response from ${response.url}`);
    }

    return result.data;
}

async function writeSidecar(sidecarPath, document) {
    const content = yaml.dump(document, { lineWidth: -1, noRefs: true, sortKeys: false });
    const temporaryPath = `${sidecarPath}.${process.pid}.tmp`;

    try {
        await writeFile(temporaryPath, content, "utf8");
        await rename(temporaryPath, sidecarPath);
    } finally {
        await unlink(temporaryPath).catch(() => {});
    }
}
