import assert from "node:assert/strict";
import test from "node:test";

import { buildBookNavigation } from "../src/lib/server/book-navigation.js";

function row({ id, parentId = null, title, isFile = true }) {
    return {
        id,
        parent_id: parentId,
        nanoid: `n${id}`,
        title,
        is_file: isFile,
    };
}

// Book (1) > Preface (2), Book I (3, container) > Chapter A (4), Chapter B (5)
const rows = [
    row({ id: 1, title: "Book", isFile: false }),
    row({ id: 2, parentId: 1, title: "Preface" }),
    row({ id: 3, parentId: 1, title: "Book I", isFile: false }),
    row({ id: 4, parentId: 3, title: "Chapter A" }),
    row({ id: 5, parentId: 3, title: "Chapter B" }),
];

test("links the book, the ancestors and the parent", () => {
    const navigation = buildBookNavigation(rows, 4);

    assert.equal(navigation.book.title, "Book");
    assert.deepEqual(
        navigation.ancestors.map((ancestor) => ancestor.title),
        ["Book I"],
    );
    assert.equal(navigation.parent.title, "Book I");
});

test("lists every intermediate level in the breadcrumb", () => {
    const deepRows = [
        row({ id: 1, title: "Book", isFile: false }),
        row({ id: 2, parentId: 1, title: "Part", isFile: false }),
        row({ id: 3, parentId: 2, title: "Chapter", isFile: false }),
        row({ id: 4, parentId: 3, title: "Section" }),
    ];

    const navigation = buildBookNavigation(deepRows, 4);

    assert.equal(navigation.book.title, "Book");
    assert.deepEqual(
        navigation.ancestors.map((ancestor) => ancestor.title),
        ["Part", "Chapter"],
    );
    assert.equal(navigation.parent.title, "Chapter");
});

test("follows the reading order across a container page", () => {
    assert.equal(buildBookNavigation(rows, 2).next.title, "Chapter A");
    assert.equal(buildBookNavigation(rows, 3).next.title, "Chapter A");
    assert.equal(buildBookNavigation(rows, 4).previous.title, "Preface");
    assert.equal(buildBookNavigation(rows, 4).next.title, "Chapter B");
    assert.equal(buildBookNavigation(rows, 5).previous.title, "Chapter A");
});

test("returns no neighbour at the edges of the book", () => {
    assert.equal(buildBookNavigation(rows, 2).previous, null);
    assert.equal(buildBookNavigation(rows, 5).next, null);
});

test("returns no parent and no neighbour for the book root", () => {
    const navigation = buildBookNavigation(rows, 1);

    assert.equal(navigation.book.title, "Book");
    assert.equal(navigation.parent, null);
    assert.deepEqual(navigation.ancestors, []);
    assert.equal(navigation.previous, null);
    assert.equal(navigation.next, null);
});

test("returns null for an unknown node", () => {
    assert.equal(buildBookNavigation(rows, 99), null);
});
