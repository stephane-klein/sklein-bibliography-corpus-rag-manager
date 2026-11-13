// The vectorization state of one Markdown-backed section, decided from its own
// chunk counts. The list of documents keeps a separate aggregate for a whole
// book, because a book also reports how many of its chapters are ready; the
// single-document branch there calls this function instead of repeating the
// rule.
//
// "ready" means every chunk carries a vector from the current model and with
// the standard strategy, which is exactly what hybrid search requires.
export function sectionVectorizationState({ chunkCount, readyChunkCount, embeddedChunkCount }) {
    if (chunkCount === 0) {
        return "none";
    }

    if (readyChunkCount === chunkCount) {
        return "ready";
    }

    if (readyChunkCount > 0) {
        return "partial";
    }

    return embeddedChunkCount === 0 ? "pending" : "stale";
}
