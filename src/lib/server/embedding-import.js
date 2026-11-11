import { access, readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import * as yaml from "js-yaml";
import { readEmbeddingsFile } from "#lib/server/embeddings-file.js";

// A sidecar alone is not enough: generate-embeddings may not have run yet.
// Treat a sidecar without its binary as missing embeddings, so the document is
// still imported and the summary reports it, unless --require-embeddings is set.
export async function hasEmbeddingSidecar(sourcePath) {
    try {
        const document = yaml.load(await readFile(`${sourcePath}.yaml`, "utf8"));
        const embeddingFile = document?.manifest?.embedding_file;

        if (typeof embeddingFile !== "string" || basename(embeddingFile) !== embeddingFile) {
            return false;
        }

        await access(join(dirname(sourcePath), embeddingFile));

        return true;
    } catch {
        return false;
    }
}

export async function readEmbeddingSidecar(sourcePath, relativeToContents, sourceFileHash) {
    const document = yaml.load(await readFile(`${sourcePath}.yaml`, "utf8"));
    const { manifest, chunks } = validateSidecar(document, relativeToContents);

    if (manifest.source_file_hash !== sourceFileHash) {
        throw new Error(`Sidecar is stale for ${relativeToContents}; run generate-sidecars first`);
    }

    if (typeof manifest.embedding_file !== "string" || basename(manifest.embedding_file) !== manifest.embedding_file) {
        throw new Error(`Missing or invalid embedding_file in ${relativeToContents}.yaml`);
    }

    const { header, embeddings } = await readEmbeddingsFile(join(dirname(sourcePath), manifest.embedding_file));

    validateEmbeddingsFile(header, embeddings, manifest, chunks, relativeToContents);

    return { manifest, chunks, embeddings };
}

export function buildChunkSyncPayload({ manifest, chunks, embeddings, dryRun }) {
    return {
        source_file: manifest.source_file,
        source_file_hash: manifest.source_file_hash,
        embedding_provider: manifest.embedding_provider,
        embedding_model: manifest.embedding_model,
        embedding_dimension: manifest.dimension,
        embedding_strategy: manifest.embedding_strategy,
        embedding_input_format: manifest.embedding_input_format,
        embedding_input_type: manifest.embedding_input_type,
        embedding_file: manifest.embedding_file,
        embedding_format: manifest.embedding_format,
        chunk_count: chunks.length,
        chunks: chunks.map((chunk, index) => ({
            chunk_index: chunk.chunk_index,
            heading_path: chunk.heading_path,
            content: chunk.text,
            content_token_count: chunk.content_token_count,
            embedding: Array.from(embeddings[index]),
        })),
        dry_run: dryRun,
    };
}

function validateSidecar(document, relativeToContents) {
    if (!document || typeof document !== "object" || Array.isArray(document)) {
        throw new Error(`Sidecar must be a YAML object: ${relativeToContents}.yaml`);
    }

    const { manifest, chunks } = document;

    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
        throw new Error(`Sidecar has no manifest: ${relativeToContents}.yaml`);
    }

    if (!Array.isArray(chunks)) {
        throw new Error(`Sidecar has no chunks list: ${relativeToContents}.yaml`);
    }

    if (manifest.type !== "manifest") {
        throw new Error(`Sidecar manifest type must be "manifest": ${relativeToContents}.yaml`);
    }

    if (manifest.schema_version !== 1) {
        throw new Error(`Sidecar schema_version must be 1: ${relativeToContents}.yaml`);
    }

    if (manifest.source_file !== relativeToContents) {
        throw new Error(`Sidecar source_file must be ${relativeToContents}: ${relativeToContents}.yaml`);
    }

    if (manifest.chunk_count !== chunks.length) {
        throw new Error(
            `Sidecar chunk_count is ${manifest.chunk_count}, but chunks has ${chunks.length} items: ${relativeToContents}.yaml`,
        );
    }

    if (manifest.dimension !== 1024) {
        throw new Error(`Sidecar dimension must be 1024: ${relativeToContents}.yaml`);
    }

    for (const field of [
        "embedding_provider",
        "embedding_model",
        "embedding_format",
        "embedding_input_format",
        "embedding_input_type",
        "embedding_strategy",
    ]) {
        if (typeof manifest[field] !== "string" || !manifest[field].trim()) {
            throw new Error(`Sidecar manifest has no ${field}: ${relativeToContents}.yaml`);
        }
    }

    for (const [index, chunk] of chunks.entries()) {
        if (!chunk || typeof chunk !== "object" || Array.isArray(chunk)) {
            throw new Error(`Sidecar chunk ${index} must be an object: ${relativeToContents}.yaml`);
        }

        if (chunk.chunk_index !== index) {
            throw new Error(`Sidecar chunk_index must be ${index}: ${relativeToContents}.yaml`);
        }

        if (typeof chunk.heading_path !== "string" || !chunk.heading_path.trim()) {
            throw new Error(`Sidecar chunk ${index} has no heading_path: ${relativeToContents}.yaml`);
        }

        if (typeof chunk.text !== "string" || !chunk.text.trim()) {
            throw new Error(`Sidecar chunk ${index} has no text: ${relativeToContents}.yaml`);
        }

        if (!Number.isInteger(chunk.content_token_count) || chunk.content_token_count < 0) {
            throw new Error(`Sidecar chunk ${index} has an invalid content_token_count: ${relativeToContents}.yaml`);
        }
    }

    return { manifest, chunks };
}

function validateEmbeddingsFile(header, embeddings, manifest, chunks, relativeToContents) {
    if (header.provider !== manifest.embedding_provider) {
        throw new Error(`Embeddings provider mismatch for ${relativeToContents}`);
    }

    if (header.model !== manifest.embedding_model) {
        throw new Error(`Embeddings model mismatch for ${relativeToContents}`);
    }

    if (header.dimension !== manifest.dimension) {
        throw new Error(`Embeddings dimension mismatch for ${relativeToContents}`);
    }

    if (header.chunk_count !== chunks.length) {
        throw new Error(`Embeddings chunk_count mismatch for ${relativeToContents}`);
    }

    if (header.source_file_hash !== manifest.source_file_hash) {
        throw new Error(`Embeddings source_file_hash mismatch for ${relativeToContents}`);
    }

    if (header.input_format !== manifest.embedding_input_format) {
        throw new Error(`Embeddings input_format mismatch for ${relativeToContents}`);
    }

    if (header.input_type !== manifest.embedding_input_type) {
        throw new Error(`Embeddings input_type mismatch for ${relativeToContents}`);
    }

    if (header.strategy !== manifest.embedding_strategy) {
        throw new Error(`Embeddings strategy mismatch for ${relativeToContents}`);
    }

    if (embeddings.length !== chunks.length) {
        throw new Error(`Embeddings vector count mismatch for ${relativeToContents}`);
    }
}
