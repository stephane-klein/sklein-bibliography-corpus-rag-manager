import assert from "node:assert/strict";
import test from "node:test";

import { buildOutline } from "../src/lib/server/book-outline.js";

function row({ id, parentId = null, title, isFile = true, tokens, chunks = 1, readyChunks = 1, embeddedChunks = 1 }) {
    return {
        id,
        parent_id: parentId,
        nanoid: `n${id}`,
        title,
        is_file: isFile,
        tokens,
        chunk_count: chunks,
        ready_chunk_count: readyChunks,
        embedded_chunk_count: embeddedChunks,
    };
}

// Book (1) > Preface (2, file), Book I (3, container) > Chapter A (4), Chapter B (5)
const rows = [
    row({ id: 1, title: "Book", isFile: false, tokens: 0 }),
    row({ id: 2, parentId: 1, title: "Preface", tokens: 100 }),
    row({ id: 3, parentId: 1, title: "Book I", isFile: false, tokens: 0 }),
    row({ id: 4, parentId: 3, title: "Chapter A", tokens: 300 }),
    row({ id: 5, parentId: 3, title: "Chapter B", tokens: 250, chunks: 4, readyChunks: 4, embeddedChunks: 4 }),
];

test("keeps the row order and nests children under their parent", () => {
    const outline = buildOutline(rows, 1);

    assert.deepEqual(
        outline.children.map((child) => child.title),
        ["Preface", "Book I"],
    );
    assert.deepEqual(
        outline.children[1].children.map((child) => child.title),
        ["Chapter A", "Chapter B"],
    );
});

test("sums tokens and sections over the subtree", () => {
    const outline = buildOutline(rows, 1);

    assert.equal(outline.totalTokens, 650);
    assert.equal(outline.sectionCount, 3);
    assert.equal(outline.children[1].totalTokens, 550);
    assert.equal(outline.children[1].children[1].totalTokens, 250);
});

test("states a section from its own chunk counts", () => {
    const outline = buildOutline(
        [
            row({ id: 1, title: "Book", isFile: false, tokens: 0 }),
            row({ id: 2, parentId: 1, title: "Empty", tokens: 10, chunks: 0, readyChunks: 0, embeddedChunks: 0 }),
            row({ id: 3, parentId: 1, title: "Half", tokens: 20, chunks: 4, readyChunks: 2, embeddedChunks: 4 }),
            row({ id: 4, parentId: 1, title: "Old", tokens: 30, chunks: 2, readyChunks: 0, embeddedChunks: 2 }),
            row({ id: 5, parentId: 1, title: "Fresh", tokens: 40, chunks: 2, readyChunks: 2, embeddedChunks: 2 }),
        ],
        1,
    );

    assert.deepEqual(
        outline.children.map((child) => child.state),
        ["none", "partial", "stale", "ready"],
    );
    assert.equal(outline.sectionCount, 4);
});

test("returns null when the root is missing", () => {
    assert.equal(buildOutline(rows, 99), null);
});
