import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { createVoyage } from "voyage-ai-provider";
import { logger } from "#lib/server/logger.js";

const PROVIDER = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_PROVIDER || "voyage";
const DEFAULT_MODEL = PROVIDER === "voyage" ? "voyage-4" : "text-embedding-3-small";
const DEFAULT_QUERY_MODEL = PROVIDER === "voyage" ? "voyage-4-lite" : DEFAULT_MODEL;
const DEFAULT_DIMENSION = PROVIDER === "voyage" ? 1024 : 1536;
const MODEL = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_MODEL || DEFAULT_MODEL;
const QUERY_MODEL = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_QUERY_MODEL || DEFAULT_QUERY_MODEL;
const DIMENSION = Number(process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_DIMENSION || DEFAULT_DIMENSION);
const BASE_URL = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_BASE_URL;
const API_KEY = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_API_KEY;
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const MAX_PARALLEL_CALLS = 1;
const COST_BASIS = "list_price";
const VOYAGE_4_PRICE_PER_MILLION_TOKENS_USD = 0.06;
const VOYAGE_4_LITE_PRICE_PER_MILLION_TOKENS_USD = 0.02;
const warnedUnpricedModels = new Set();

// The document model is a configuration value on its own. Reading it must not
// fail when the API key is missing: the documents list compares stored vectors
// with this model, and the page has to render either way.
export function getEmbeddingModel() {
    return MODEL;
}

export function getEmbeddingInfo() {
    if (PROVIDER !== "voyage" && PROVIDER !== "openai") {
        throw new Error(`Unsupported embedding provider: ${PROVIDER}`);
    }

    if (!API_KEY) {
        throw new Error("SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_API_KEY is not configured");
    }

    if (!Number.isInteger(DIMENSION) || DIMENSION <= 0) {
        throw new Error("SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_DIMENSION must be a positive integer");
    }

    return { provider: PROVIDER, model: MODEL, query_model: QUERY_MODEL, dimension: DIMENSION };
}

export async function embedTexts(texts, { inputType = "document", timeoutMs = TIMEOUT_MS } = {}) {
    if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error("texts must be a non-empty array");
    }

    if (inputType !== "document" && inputType !== "query") {
        throw new Error("inputType must be document or query");
    }

    const info = getEmbeddingInfo();
    const modelId = inputType === "query" ? info.query_model : info.model;
    const options = {
        model: createModel(modelId),
        values: texts,
        maxRetries: MAX_RETRIES,
        maxParallelCalls: MAX_PARALLEL_CALLS,
        abortSignal: AbortSignal.timeout(timeoutMs),
    };

    if (PROVIDER === "voyage") {
        options.providerOptions = {
            voyage: {
                inputType,
                outputDimension: info.dimension,
                outputDtype: "float",
                truncation: false,
            },
        };
    } else {
        options.dimensions = info.dimension;
    }

    const { embeddings, usage, warnings } = await embedMany(options);

    if (warnings.length > 0) {
        logger.warn({ warnings }, "Embedding provider warnings");
    }

    if (embeddings.length !== texts.length) {
        throw new Error(`Embedding provider returned ${embeddings.length} vectors for ${texts.length} texts`);
    }

    for (const embedding of embeddings) {
        if (embedding.length !== info.dimension) {
            throw new Error(
                `Embedding provider returned a vector of ${embedding.length} dimensions, expected ${info.dimension}`,
            );
        }

        for (const value of embedding) {
            if (!Number.isFinite(value)) {
                throw new Error("Embedding provider returned a non-finite value");
            }
        }
    }

    const tokens = usage?.tokens ?? 0;
    const pricePerMillionTokensUsd = pricePerMillionTokensUsdFor(PROVIDER, modelId);

    if (pricePerMillionTokensUsd === null && !warnedUnpricedModels.has(`${PROVIDER}/${modelId}`)) {
        warnedUnpricedModels.add(`${PROVIDER}/${modelId}`);
        logger.warn({ provider: PROVIDER, model: modelId }, "No embedding price is configured; the cost is unknown");
    }

    return {
        ...info,
        model: modelId,
        embeddings,
        usage: {
            ...usage,
            tokens,
            cost_usd:
                pricePerMillionTokensUsd === null ? null : roundUsd((tokens * pricePerMillionTokensUsd) / 1_000_000),
            cost_basis: COST_BASIS,
            price_per_million_tokens_usd: pricePerMillionTokensUsd,
        },
    };
}

function pricePerMillionTokensUsdFor(provider, model) {
    if (provider === "voyage" && model === "voyage-4") {
        return VOYAGE_4_PRICE_PER_MILLION_TOKENS_USD;
    }

    if (provider === "voyage" && model === "voyage-4-lite") {
        return VOYAGE_4_LITE_PRICE_PER_MILLION_TOKENS_USD;
    }

    return null;
}

function roundUsd(value) {
    return Math.round(value * 1e9) / 1e9;
}

function createModel(modelId) {
    if (PROVIDER === "voyage") {
        const voyage = createVoyage({ apiKey: API_KEY, baseURL: BASE_URL || undefined });

        return voyage.embeddingModel(modelId);
    }

    const openai = createOpenAI({ apiKey: API_KEY, baseURL: BASE_URL || undefined });

    return openai.embedding(modelId);
}
