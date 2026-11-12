import assert from "node:assert/strict";
import test from "node:test";

import { clampInteger, normalizeWords, toSemanticResult } from "../src/lib/server/mcp/semantic-search.js";

test("normalizes author and title words", () => {
    assert.deepEqual(normalizeWords("Thibaut Giraud"), ["Thibaut", "Giraud"]);
    assert.deepEqual(normalizeWords(["Thibaut", "Giraud"]), ["Thibaut", "Giraud"]);
    assert.deepEqual(normalizeWords(undefined), []);
});

test("clamps paging values", () => {
    assert.equal(clampInteger(undefined, { fallback: 1, min: 1, max: 20 }), 1);
    assert.equal(clampInteger(0, { fallback: 1, min: 1, max: 20 }), 1);
    assert.equal(clampInteger(25, { fallback: 10, min: 1, max: 20 }), 20);
});

test("maps a hybrid result", () => {
    const result = toSemanticResult({
        id: 83,
        nanoid: "abc",
        title: "Title",
        authors: ["Thibaut Giraud"],
        original_published_date: "2017-05-24",
        source_url: "https://example.test",
        bestChunk: { heading_path: "A > B", chunk_index: 41, content: "Un extrait." },
        distance: 0.2,
        bm25Rank: 3,
        vectorRank: 1,
        rrf: 0.03,
    });

    assert.equal(result.content_node_id, 83);
    assert.equal(result.chunk_index, 41);
    assert.equal(result.excerpt, "Un extrait.");
    assert.equal(result.bm25_rank, 3);
    assert.equal(result.vector_rank, 1);
});

test("maps a BM25-only result and strips mark tags", () => {
    const result = toSemanticResult({
        id: 84,
        nanoid: "def",
        title: "Title",
        authors: [],
        snippets: ["<mark>limite</mark> de l&#x27;utilitarisme &amp; de la morale"],
    });

    assert.equal(result.excerpt, "limite de l'utilitarisme & de la morale");
    assert.equal(result.chunk_index, null);
    assert.equal(result.heading_path, null);
});
