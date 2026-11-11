import assert from "node:assert/strict";
import test from "node:test";

import {
    applyVectorizeVectors,
    assertNoVectorizeCalls,
    assertReadOnlySingleStatement,
    extractVectorizeTexts,
    VectorizeSqlError,
} from "../src/lib/server/mcp/vectorize-sql.js";

const VECTOR = [0.1, 0.2, 0.3];

async function rewrite(sql, vectors = new Map()) {
    const { ast } = await extractVectorizeTexts(sql);
    assertReadOnlySingleStatement(ast);

    return applyVectorizeVectors(ast, vectors);
}

test("replaces a vectorize() call with a vector cast", async () => {
    const sql = await rewrite("SELECT vectorize('condorcet') AS v", new Map([["condorcet", VECTOR]]));

    assert.match(sql, /CAST\('\[0\.1,0\.2,0\.3\]' AS vector\)/);
    assert.doesNotMatch(sql, /vectorize/i);
});

test("handles uppercase and quoted function names", async () => {
    for (const name of ["VECTORIZE", '"vectorize"']) {
        const sql = await rewrite(`SELECT ${name}('condorcet') AS v`, new Map([["condorcet", VECTOR]]));
        assert.match(sql, /CAST\('\[0\.1,0\.2,0\.3\]' AS vector\)/);
    }
});

test("keeps non-ASCII text intact", async () => {
    const sql = await rewrite("SELECT 'éàü', vectorize('café') AS v", new Map([["café", VECTOR]]));

    assert.match(sql, /'éàü'/);
    assert.match(sql, /CAST\('\[0\.1,0\.2,0\.3\]' AS vector\)/);
});

test("ignores comments, strings and other function names", async () => {
    const sql = ["-- vectorize('commented')", "SELECT 'vectorize(''string'')', my_vectorize('kept')"].join("\n");
    const { texts } = await extractVectorizeTexts(sql);

    assert.deepEqual(texts, []);
});

test("ignores dollar-quoted function bodies", async () => {
    const { texts } = await extractVectorizeTexts(
        "CREATE FUNCTION f() RETURNS void LANGUAGE plpgsql AS $$ BEGIN PERFORM vectorize('body'); END $$",
    );

    assert.deepEqual(texts, []);
});

test("rejects a column reference", async () => {
    await assert.rejects(
        async () => extractVectorizeTexts("SELECT vectorize(content) FROM content_chunks"),
        /only accepts a string literal/,
    );
});

test("rejects a schema-qualified call", async () => {
    await assert.rejects(
        async () => extractVectorizeTexts("SELECT public.vectorize('condorcet')"),
        /without a schema prefix/,
    );
});

test("rejects multiple statements", async () => {
    const { ast } = await extractVectorizeTexts("SELECT 1; SELECT 2");

    assert.throws(() => assertReadOnlySingleStatement(ast), /exactly one/);
});

test("rejects writes and locking selects", async () => {
    for (const sql of [
        "DELETE FROM content_chunks",
        "SELECT * FROM content_chunks FOR UPDATE",
        "SELECT * INTO copy FROM content_chunks",
    ]) {
        const { ast } = await extractVectorizeTexts(sql);
        assert.throws(() => assertReadOnlySingleStatement(ast), VectorizeSqlError);
    }
});

test("allows WITH, EXPLAIN and UNION selects", async () => {
    for (const sql of [
        "WITH q AS (SELECT 1 AS n) SELECT * FROM q",
        "EXPLAIN SELECT * FROM content_chunks",
        "SELECT 1 UNION SELECT 2",
    ]) {
        const { ast } = await extractVectorizeTexts(sql);
        assert.doesNotThrow(() => assertReadOnlySingleStatement(ast));
    }
});

test("rejects an EXPLAIN of a write statement", async () => {
    const { ast } = await extractVectorizeTexts("EXPLAIN DELETE FROM content_chunks");

    assert.throws(() => assertReadOnlySingleStatement(ast), /read-only SELECT/);
});

test("rejects a data-modifying CTE", async () => {
    const { ast } = await extractVectorizeTexts(
        "WITH removed AS (DELETE FROM content_chunks RETURNING id) SELECT * FROM removed",
    );

    assert.throws(() => assertReadOnlySingleStatement(ast), /read-only SELECT/);
});

test("rewrites every occurrence of the same text", async () => {
    const sql = await rewrite(
        "SELECT vectorize('condorcet'), vectorize('condorcet')",
        new Map([["condorcet", VECTOR]]),
    );

    assert.equal((sql.match(/CAST\('\[0\.1,0\.2,0\.3\]' AS vector\)/g) ?? []).length, 2);
    await assertNoVectorizeCalls(sql);
});
