function intFromEnv(name, fallback) {
    const value = Number.parseInt(process.env[name] ?? "", 10);
    return Number.isInteger(value) && value > 0 ? value : fallback;
}

export const MAX_OUTPUT_CHARS = intFromEnv("SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_MAX_OUTPUT_CHARS", 200000);
export const DEFAULT_MAX_OUTPUT_CHARS = intFromEnv(
    "SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_DEFAULT_MAX_OUTPUT_CHARS",
    50000,
);
export const MAX_QUERY_CHARS = intFromEnv("SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_MAX_QUERY_CHARS", 100000);
export const MAX_VECTORIZE_TEXTS = intFromEnv("SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_MAX_VECTORIZE_TEXTS", 8);
export const MAX_VECTORIZE_TEXT_CHARS = intFromEnv(
    "SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_MAX_VECTORIZE_TEXT_CHARS",
    2000,
);
