import { embedTexts, getEmbeddingInfo } from "#lib/server/embedding.js";
import { logger } from "#lib/server/logger.js";
import { buildQueryEmbeddingKey, readQueryEmbedding, writeQueryEmbedding } from "#lib/server/query-embedding-cache.js";

const EXPECTED_DIMENSION = 1024;

export class EmbeddingError extends Error {
    constructor(message, { cause } = {}) {
        super(message, { cause });
        this.name = "EmbeddingError";
        this.stage = "embedding";
    }
}

// Resolves every text through the query embedding cache, embeds the misses in
// one provider call, then writes the new vectors back to the cache. Identical
// texts share one provider call and one vector.
export async function getQueryEmbeddings(texts, { timeoutMs = 10_000 } = {}) {
    const uniqueTexts = [...new Set(texts)];

    if (uniqueTexts.length === 0) {
        return { vectors: new Map(), calls: 0, cacheHits: 0, tokens: 0, costUsd: 0, ms: 0, model: null };
    }

    const startedAt = performance.now();

    let info;

    try {
        info = getEmbeddingInfo();
    } catch (err) {
        throw new EmbeddingError(`Semantic search is unavailable: ${err.message}`, { cause: err });
    }

    if (info.dimension !== EXPECTED_DIMENSION) {
        throw new EmbeddingError(
            `The embedding model returns ${info.dimension} dimensions, but content_chunks.embedding is vector(${EXPECTED_DIMENSION})`,
        );
    }

    const keys = new Map(uniqueTexts.map((text) => [text, buildQueryEmbeddingKey(text, info)]));

    const cached = await Promise.all(
        uniqueTexts.map(async (text) => {
            try {
                const embedding = await readQueryEmbedding(keys.get(text));
                return embedding ? [text, embedding] : null;
            } catch (err) {
                // The cache is an optimisation; a cache failure must not block
                // the query. The provider call below still produces a vector.
                logger.warn({ err }, "Could not read the query embedding cache");
                return null;
            }
        }),
    );

    const vectors = new Map(cached.filter((entry) => entry !== null));
    const misses = uniqueTexts.filter((text) => !vectors.has(text));

    let tokens = 0;
    let costUsd = 0;

    if (misses.length > 0) {
        let embeddings;
        let usage;

        try {
            ({ embeddings, usage } = await embedTexts(misses, { inputType: "query", timeoutMs }));
        } catch (err) {
            throw new EmbeddingError(`Query embedding failed: ${err.message}`, { cause: err });
        }

        misses.forEach((text, index) => vectors.set(text, embeddings[index]));

        tokens = usage?.tokens ?? 0;
        costUsd = usage?.cost_usd ?? 0;

        await Promise.all(
            misses.map(async (text, index) => {
                try {
                    await writeQueryEmbedding(keys.get(text), embeddings[index]);
                } catch (err) {
                    logger.warn({ err }, "Could not write the query embedding cache");
                }
            }),
        );
    }

    return {
        vectors,
        calls: misses.length,
        cacheHits: uniqueTexts.length - misses.length,
        tokens,
        costUsd,
        ms: Math.round(performance.now() - startedAt),
        model: info.query_model,
    };
}
