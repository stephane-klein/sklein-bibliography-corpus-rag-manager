import assert from "node:assert/strict";
import test from "node:test";

import { resultMetaFor, sanitizeJsonObject, toolArgumentsFor } from "../src/lib/server/mcp/log-fields.js";

test("keeps only the allowed arguments for semanticSearch", () => {
    const args = toolArgumentsFor("semanticSearch", {
        query: "limites de l'utilitarisme",
        purpose: "Find passages",
        authors: "Monsieur Phi",
        title: null,
        limit: 10,
        page: 1,
        maxCharacters: null,
        unexpected: "dropped",
    });

    assert.deepEqual(args, {
        authors: "Monsieur Phi",
        title: null,
        limit: 10,
        page: 1,
        maxCharacters: null,
    });
});

test("keeps only the allowed arguments for readOnlySqlQuery", () => {
    const args = toolArgumentsFor("readOnlySqlQuery", {
        query: "SELECT 1",
        purpose: "Check",
        maxCharacters: 20000,
    });

    assert.deepEqual(args, { maxCharacters: 20000 });
});

test("returns an empty object for an unknown tool", () => {
    assert.deepEqual(toolArgumentsFor("unknown", { query: "SELECT 1" }), {});
});

test("truncates long strings and long arrays", () => {
    const long = "a".repeat(250);
    const args = resultMetaFor({
        long,
        authors: Array.from({ length: 25 }, (_, index) => `author-${index}`),
    });

    assert.equal(args.long.length, 201);
    assert.match(args.long, /…$/);
    assert.equal(args.authors.length, 20);
    assert.equal(args.authors[19], "author-19");
});

test("replaces an oversized payload with a bounded preview", () => {
    const payload = Object.fromEntries(Array.from({ length: 100 }, (_, index) => [`key-${index}`, "x".repeat(100)]));
    const args = sanitizeJsonObject(payload);
    const json = JSON.stringify(args);

    assert.equal(args.truncated, true);
    assert.match(args.preview, /…$/);
    assert.ok(json.length < 5000);
});

test("keeps booleans, numbers and null values in result metadata", () => {
    const meta = resultMetaFor({
        hybrid: true,
        semantic_error: null,
        semantic_source: "provider",
        total_pages: 3,
    });

    assert.deepEqual(meta, {
        hybrid: true,
        semantic_error: null,
        semantic_source: "provider",
        total_pages: 3,
    });
});
