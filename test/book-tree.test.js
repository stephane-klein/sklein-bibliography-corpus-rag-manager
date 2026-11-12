import assert from "node:assert/strict";
import test from "node:test";

import { buildBookTree } from "../src/lib/server/book-tree.js";

const toc = {
    title: "Test Book",
    toc: [
        { title: "Preface", path: "01-preface", children: [] },
        {
            title: "Book I",
            path: "02-book-i",
            children: [
                { title: "Chapter I", path: "02-book-i/01-chapter-i", children: [] },
                { title: "Contents", path: "02-book-i/02-contents", children: [] },
            ],
        },
        { title: "Empty section", path: "03-empty", children: [] },
    ],
};

const filesByPath = new Map([
    [
        "01-preface",
        {
            relativePath: "01-preface.md",
            raw: Buffer.from("preface"),
            frontmatter: { path: "01-preface", title: "Preface" },
            body: "preface body",
        },
    ],
    [
        "02-book-i/01-chapter-i",
        {
            relativePath: "02-book-i/01-chapter-i.md",
            raw: Buffer.from("chapter"),
            frontmatter: { path: "02-book-i/01-chapter-i", title: "Chapter I" },
            body: "chapter body",
        },
    ],
    [
        "02-book-i/02-contents",
        {
            relativePath: "02-book-i/02-contents.md",
            raw: Buffer.from("contents"),
            frontmatter: { path: "02-book-i/02-contents", title: "Contents" },
            body: "contents body",
        },
    ],
]);

const config = {
    slug: "test-book",
    exclude: ["02-book-i/02-contents.md"],
    bibliography: {
        authors: ["A. Author"],
        contributors: ["B. Editor"],
        original_published_date: "1900",
        edition_date: "2000-01-01",
        language: "en",
        source_kind: "epub",
    },
};

test("builds a work, a part and the file-backed sections", () => {
    const nodes = buildBookTree({ toc, config, filesByPath });

    assert.deepEqual(
        nodes.map((node) => node.slug),
        ["test-book", "test-book/01-preface", "test-book/02-book-i", "test-book/02-book-i/01-chapter-i"],
    );
});

test("keeps the work and parts as empty structural nodes", () => {
    const [root, preface, part] = buildBookTree({ toc, config, filesByPath });

    assert.equal(root.parent_slug, null);
    assert.equal(root.depth, 0);
    assert.equal(root.position, 0);
    assert.equal(root.content, "");
    assert.equal(root.file, null);
    assert.deepEqual(root.metadata.breadcrumb, ["Test Book"]);
    assert.deepEqual(root.metadata.bibliography, config.bibliography);

    assert.equal(preface.parent_slug, "test-book");
    assert.equal(preface.depth, 1);
    assert.equal(preface.position, 0);
    assert.equal(preface.content, "preface body");
    assert.equal(preface.file.relativePath, "01-preface.md");
    assert.deepEqual(preface.metadata.breadcrumb, ["Test Book", "Preface"]);

    assert.equal(part.parent_slug, "test-book");
    assert.equal(part.depth, 1);
    assert.equal(part.position, 1);
    assert.equal(part.content, "");
    assert.equal(part.file, null);
    assert.deepEqual(part.metadata.breadcrumb, ["Test Book", "Book I"]);
});

test("skips excluded files and empty leaves", () => {
    const nodes = buildBookTree({ toc, config, filesByPath });
    const contents = nodes.find((node) => node.slug.endsWith("02-contents"));

    assert.equal(contents, undefined);
    assert.equal(
        nodes.some((node) => node.slug.endsWith("03-empty")),
        false,
    );
});

test("positions siblings in toc order after exclusions", () => {
    const nodes = buildBookTree({ toc, config, filesByPath });
    const part = nodes.find((node) => node.slug === "test-book/02-book-i");
    const chapter = nodes.find((node) => node.slug === "test-book/02-book-i/01-chapter-i");

    assert.equal(part.position, 1);
    assert.equal(chapter.parent_slug, "test-book/02-book-i");
    assert.equal(chapter.depth, 2);
    assert.equal(chapter.position, 0);
    assert.deepEqual(chapter.metadata.breadcrumb, ["Test Book", "Book I", "Chapter I"]);
});
