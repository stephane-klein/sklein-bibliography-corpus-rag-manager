function formatFilters(filters) {
    const parts = [];

    if (filters?.authors != null) parts.push(`authors=${JSON.stringify(filters.authors)}`);
    if (filters?.title != null) parts.push(`title=${JSON.stringify(filters.title)}`);

    return parts.join(", ");
}

export function classifySemanticError({ corpusVectors, filtered, vectorCount }) {
    if (vectorCount > 0) return null;
    if (corpusVectors === 0) return "no-vectors";
    if (filtered) return "filtered-out";
    return "no-matches";
}

export function buildSemanticNextStep({ total, semanticError, diagnostics, filters }) {
    const activeFilters = formatFilters(filters);

    if (total > 0) {
        const prefix = semanticError ? "These are BM25-only results. " : "";

        return (
            `${prefix}Read only the returned passages with readOnlySqlQuery, using their ` +
            "content_node_id and chunk_index. Do not select every chunk of a document."
        );
    }

    const filterText = activeFilters ? ` (${activeFilters})` : "";

    switch (semanticError) {
        case "filtered-out": {
            const vectorCount = diagnostics?.corpus_vectors;
            const vectorText = Number.isInteger(vectorCount)
                ? `${vectorCount} vectorized chunk${vectorCount === 1 ? "" : "s"}`
                : "Vectorized chunks";
            const remedy =
                filters?.authors != null
                    ? "The stored author name may use a different spelling; list authors with readOnlySqlQuery or remove the authors filter."
                    : filters?.title != null
                      ? "The stored title may use a different spelling; remove the title filter or try fewer words."
                      : "Remove the filters or try different keywords.";

            return (
                `0 matches with the current filters${filterText}. ` +
                `${vectorText} exist in the corpus, but none match these filters. ` +
                remedy
            );
        }
        case "no-vectors":
            return (
                "No chunks are vectorized for the current document model and strategy. " +
                "Use BM25, or reindex the corpus with the configured embedding model."
            );
        case "unavailable":
            return "Semantic search is unavailable; these are BM25 results only. Retry later or use a keyword search.";
        default:
            return activeFilters
                ? "No passage matches this query. Try different keywords, or remove the author/title filters."
                : "No passage matches this query. Try different keywords.";
    }
}

export function buildLargeReadWarning({ query, resultCount, threshold }) {
    if (!Number.isInteger(resultCount) || resultCount < threshold) return null;
    if (typeof query !== "string") return null;
    if (!/\bcontent_chunks\b/i.test(query)) return null;
    if (!/\bcontent\b/i.test(query) && !/\bselect\s+\*/i.test(query)) return null;

    return (
        `${resultCount} rows returned. When reading content_chunks, read only the ` +
        "chunk_index values returned by semanticSearch, for example " +
        "WHERE content_node_id = 83 AND chunk_index IN (41,42). " +
        "Reading every chunk of a document costs a lot of context."
    );
}
