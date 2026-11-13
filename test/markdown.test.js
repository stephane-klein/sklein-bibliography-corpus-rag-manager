import assert from "node:assert/strict";
import test from "node:test";

import { renderMarkdown } from "../src/lib/server/markdown.js";

test("renders a footnote reference and its note", () => {
    const html = renderMarkdown("Texte[^1].\n\n[^1]: La note.");

    assert.match(html, /<sup class="footnote-ref">/);
    assert.match(html, /<a href="#fn1" id="fnref1">1<\/a>/);
    assert.match(html, /<section class="footnotes">/);
    assert.match(html, /<li id="fn1" class="footnote-item">/);
});

test("wraps a table in a scrollable container", () => {
    const html = renderMarkdown("| A | B |\n| --- | --- |\n| 1 | 2 |");

    assert.match(html, /<div class="table-wrap"><table>/);
    assert.match(html, /<\/table><\/div>/);
    assert.match(html, /<th>A<\/th>/);
});

test("escapes raw HTML instead of rendering it", () => {
    const html = renderMarkdown("<script>alert(1)</script>");

    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>/);
});

test("does not turn a javascript link into an anchor", () => {
    const html = renderMarkdown("[x](javascript:alert(1))");

    assert.doesNotMatch(html, /href=/);
});

test("defuses a link to a page of the source EPUB", () => {
    const html = renderMarkdown("Canals, [62](5682792182066254284_38194-h-2.htm.xhtml#Page_62).");

    assert.match(html, /<a class="page-ref">62<\/a>/);
    assert.doesNotMatch(html, /href=/);
});

test("keeps an external link whose path ends with .html", () => {
    const html = renderMarkdown("[exemple](https://example.com/page.html)");

    assert.match(html, /<a href="https:\/\/example\.com\/page\.html">exemple<\/a>/);
});

test("renders an empty source as an empty string", () => {
    assert.equal(renderMarkdown(""), "");
    assert.equal(renderMarkdown(null), "");
});
