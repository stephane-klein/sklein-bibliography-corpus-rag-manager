import assert from "node:assert/strict";
import test from "node:test";

import {
    buildLargeReadWarning,
    buildSemanticNextStep,
    classifySemanticError,
} from "../src/lib/server/search-diagnostics.js";

test("classifies a corpus without vectors", () => {
    assert.equal(classifySemanticError({ corpusVectors: 0, filtered: false, vectorCount: 0 }), "no-vectors");
});

test("classifies filters that remove every vectorized chunk", () => {
    assert.equal(classifySemanticError({ corpusVectors: 5234, filtered: true, vectorCount: 0 }), "filtered-out");
});

test("classifies a query with no vector match and no filters", () => {
    assert.equal(classifySemanticError({ corpusVectors: 5234, filtered: false, vectorCount: 0 }), "no-matches");
});

test("returns null when the vector search found candidates", () => {
    assert.equal(classifySemanticError({ corpusVectors: 5234, filtered: false, vectorCount: 12 }), null);
});

test("explains a filtered-out zero result with the active filters", () => {
    const step = buildSemanticNextStep({
        total: 0,
        semanticError: "filtered-out",
        diagnostics: { corpus_vectors: 5234 },
        filters: { authors: "Phi", title: null },
    });

    assert.match(step, /authors="Phi"/);
    assert.match(step, /5234 vectorized chunks/);
    assert.match(step, /readOnlySqlQuery/);
});

test("mentions the title filter when it is the active filter", () => {
    const step = buildSemanticNextStep({
        total: 0,
        semanticError: "filtered-out",
        diagnostics: { corpus_vectors: 10 },
        filters: { authors: null, title: "Condorcet" },
    });

    assert.match(step, /title="Condorcet"/);
    assert.match(step, /title filter/);
});

test("explains a corpus without vectors", () => {
    const step = buildSemanticNextStep({
        total: 0,
        semanticError: "no-vectors",
        diagnostics: null,
        filters: { authors: null, title: null },
    });

    assert.match(step, /No chunks are vectorized/);
    assert.match(step, /BM25/);
});

test("explains an unavailable semantic search", () => {
    const step = buildSemanticNextStep({
        total: 0,
        semanticError: "unavailable",
        diagnostics: null,
        filters: { authors: null, title: null },
    });

    assert.match(step, /BM25 results only/);
});

test("suggests different keywords when nothing matches", () => {
    const step = buildSemanticNextStep({
        total: 0,
        semanticError: "no-matches",
        diagnostics: null,
        filters: { authors: null, title: null },
    });

    assert.match(step, /different keywords/);
});

test("tells the agent to read only the returned passages", () => {
    const step = buildSemanticNextStep({
        total: 56,
        semanticError: null,
        diagnostics: { vector_candidates: 200 },
        filters: { authors: "Thibaut Giraud", title: null },
    });

    assert.match(step, /content_node_id/);
    assert.match(step, /chunk_index/);
    assert.match(step, /Do not select every chunk/);
    assert.doesNotMatch(step, /BM25-only/);
});

test("marks a positive BM25 fallback as BM25-only", () => {
    const step = buildSemanticNextStep({
        total: 12,
        semanticError: "filtered-out",
        diagnostics: { corpus_vectors: 5234 },
        filters: { authors: "Phi", title: null },
    });

    assert.match(step, /BM25-only/);
});

test("warns on a large content_chunks read", () => {
    const warning = buildLargeReadWarning({
        query: "SELECT content_node_id, chunk_index, content FROM content_chunks",
        resultCount: 114,
        threshold: 50,
    });

    assert.match(warning, /114 rows/);
    assert.match(warning, /chunk_index/);
    assert.match(warning, /semanticSearch/);
});

test("warns on a large SELECT * from content_chunks", () => {
    const warning = buildLargeReadWarning({
        query: "SELECT * FROM content_chunks",
        resultCount: 50,
        threshold: 50,
    });

    assert.match(warning, /50 rows/);
});

test("does not warn below the threshold", () => {
    assert.equal(
        buildLargeReadWarning({
            query: "SELECT content FROM content_chunks",
            resultCount: 49,
            threshold: 50,
        }),
        null,
    );
});

test("does not warn without content_chunks", () => {
    assert.equal(
        buildLargeReadWarning({
            query: "SELECT content FROM hierarchical_content_nodes",
            resultCount: 100,
            threshold: 50,
        }),
        null,
    );
});

test("does not warn when only metadata is selected", () => {
    assert.equal(
        buildLargeReadWarning({
            query: "SELECT content_node_id, chunk_index FROM content_chunks",
            resultCount: 100,
            threshold: 50,
        }),
        null,
    );
});
