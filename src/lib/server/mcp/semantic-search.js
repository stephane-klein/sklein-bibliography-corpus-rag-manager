export function normalizeWords(value) {
    const values = Array.isArray(value) ? value : [value];

    return values
        .filter((entry) => typeof entry === "string")
        .flatMap((entry) => entry.trim().split(/\s+/u))
        .filter((word) => word.length > 0);
}

export function clampInteger(value, { fallback, min, max }) {
    if (!Number.isInteger(value)) return fallback;

    return Math.min(Math.max(value, min), max);
}

export function cleanExcerpt(text) {
    return text
        .replaceAll("<mark>", "")
        .replaceAll("</mark>", "")
        .replaceAll("&#x27;", "'")
        .replaceAll("&#39;", "'")
        .replaceAll("&quot;", '"')
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&amp;", "&");
}

export function toSemanticResult(document) {
    const chunk = document.bestChunk ?? null;
    const excerpt = chunk?.content ?? document.snippets?.[0] ?? null;

    return {
        content_node_id: document.id ?? null,
        nanoid: document.nanoid,
        title: document.title,
        authors: document.authors ?? [],
        original_published_date: document.original_published_date,
        source_url: document.source_url,
        chunk_index: chunk?.chunk_index ?? null,
        heading_path: chunk?.heading_path ?? null,
        excerpt: excerpt === null ? null : cleanExcerpt(excerpt),
        distance: document.distance ?? null,
        bm25_rank: document.bm25Rank ?? null,
        vector_rank: document.vectorRank ?? null,
        rrf: document.rrf ?? null,
    };
}
