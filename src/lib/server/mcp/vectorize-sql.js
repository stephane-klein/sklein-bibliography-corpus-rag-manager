import { deparse } from "pgsql-deparser";
import { parse } from "pgsql-parser";

export class VectorizeSqlError extends Error {
    constructor(message, { stage = "validation", cause } = {}) {
        super(message, { cause });
        this.name = "VectorizeSqlError";
        this.stage = stage;
    }
}

// `SELECT '[0]'::vector` parsed once, then cloned for every vectorize() call.
// Cloning keeps the node shape in sync with the parser version instead of
// hand-writing a TypeCast/A_Const tree.
let vectorCastPromise = null;

function getVectorCast() {
    vectorCastPromise ??= parse("SELECT '[0]'::vector").then(
        (ast) => ast.stmts[0].stmt.SelectStmt.targetList[0].ResTarget.val,
    );

    return vectorCastPromise;
}

function walk(node, visit, parent = null, key = null) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
        for (let index = 0; index < node.length; index++) {
            walk(node[index], visit, node, index);
        }
        return;
    }

    visit(node, parent, key);

    for (const [childKey, child] of Object.entries(node)) {
        walk(child, visit, node, childKey);
    }
}

function functionName(call) {
    if (!Array.isArray(call.funcname) || call.funcname.length === 0) return null;

    return call.funcname.at(-1)?.String?.sval ?? null;
}

function isSimpleVectorize(call) {
    return call.funcname?.length === 1 && call.funcname[0].String?.sval === "vectorize";
}

function isQualifiedVectorize(call) {
    return Boolean(call.funcname?.length > 1 && functionName(call) === "vectorize");
}

function readVectorizeText(call) {
    if (call.funcformat !== "COERCE_EXPLICIT_CALL") {
        throw new VectorizeSqlError("vectorize() must be called as a plain function, without OVER or FILTER");
    }

    if (call.over || call.filter || call.agg_star || call.agg_distinct || call.agg_order || call.agg_within_group) {
        throw new VectorizeSqlError(
            "vectorize() must be called as a plain function, without OVER, FILTER or aggregate options",
        );
    }

    if (call.args?.length !== 1) {
        throw new VectorizeSqlError(
            "vectorize() accepts exactly one string literal, e.g. vectorize('le principe de condorcet')",
        );
    }

    const text = call.args[0]?.A_Const?.sval?.sval;

    if (typeof text !== "string") {
        throw new VectorizeSqlError(
            "vectorize() only accepts a string literal, e.g. vectorize('le principe de condorcet'). " +
                "Column references and expressions need a first query that returns the text.",
        );
    }

    if (text.trim().length === 0) {
        throw new VectorizeSqlError("vectorize() text must not be empty");
    }

    if (text.includes("\u0000")) {
        throw new VectorizeSqlError("vectorize() text must not contain a NUL character");
    }

    return text;
}

// Returns the parsed AST and every vectorize() text in source order. Duplicates
// are preserved; the caller deduplicates before calling the embedding provider.
export async function extractVectorizeTexts(sql) {
    let ast;

    try {
        ast = await parse(sql);
    } catch (err) {
        throw new VectorizeSqlError(`SQL syntax error: ${firstLine(err.message)}`, { cause: err });
    }

    const texts = [];
    walk(ast, (node) => {
        if (!node.FuncCall) return;

        if (isQualifiedVectorize(node.FuncCall)) {
            throw new VectorizeSqlError(
                "Call vectorize() without a schema prefix; the MCP server reserves the unqualified name.",
            );
        }

        if (isSimpleVectorize(node.FuncCall)) {
            texts.push(readVectorizeText(node.FuncCall));
        }
    });

    return { ast, texts };
}

export async function applyVectorizeVectors(ast, vectorsByText) {
    const vectorCast = await getVectorCast();

    walk(ast, (node, parent, key) => {
        if (!node.FuncCall || !isSimpleVectorize(node.FuncCall)) return;

        const text = readVectorizeText(node.FuncCall);
        const vector = vectorsByText.get(text);

        if (!vector) {
            throw new VectorizeSqlError(`No embedding was computed for vectorize() text: ${text}`, {
                stage: "embedding",
            });
        }

        const cast = structuredClone(vectorCast);
        cast.TypeCast.arg.A_Const.sval.sval = JSON.stringify(vector);
        parent[key] = cast;
    });

    let rewritten;

    try {
        rewritten = await deparse(ast);
    } catch (err) {
        throw new VectorizeSqlError(`Could not rewrite the query: ${firstLine(err.message)}`, { cause: err });
    }

    await assertNoVectorizeCalls(rewritten);

    return rewritten;
}

export async function assertNoVectorizeCalls(sql) {
    let ast;

    try {
        ast = await parse(sql);
    } catch (err) {
        throw new VectorizeSqlError(`The rewritten query is not valid SQL: ${firstLine(err.message)}`, { cause: err });
    }

    walk(ast, (node) => {
        if (node.FuncCall && (isSimpleVectorize(node.FuncCall) || isQualifiedVectorize(node.FuncCall))) {
            throw new VectorizeSqlError("The rewritten query still contains a vectorize() call");
        }
    });
}

// The MCP server only exposes read-only queries. The reader role and the
// READ ONLY transaction are the real guards; this check gives the model a clear
// error before any work happens and keeps DO/CREATE bodies out of the rewrite.
export function assertReadOnlySingleStatement(ast) {
    if (ast.stmts?.length !== 1) {
        throw new VectorizeSqlError("Run exactly one SELECT, WITH or EXPLAIN statement per call");
    }

    walk(ast, (node) => {
        if (node.InsertStmt || node.UpdateStmt || node.DeleteStmt || node.MergeStmt) {
            throw new VectorizeSqlError("Only read-only SELECT statements are allowed");
        }
    });

    const stmt = ast.stmts[0].stmt;

    if (stmt.SelectStmt) {
        assertReadOnlySelect(stmt.SelectStmt);
        return;
    }

    if (stmt.ExplainStmt?.query?.SelectStmt) {
        assertReadOnlySelect(stmt.ExplainStmt.query.SelectStmt);
        return;
    }

    throw new VectorizeSqlError("Only SELECT, WITH and EXPLAIN SELECT statements are allowed");
}

function assertReadOnlySelect(select) {
    if (select.intoClause) {
        throw new VectorizeSqlError("SELECT INTO is not allowed; it creates a table");
    }

    if (select.lockingClause?.length) {
        throw new VectorizeSqlError("SELECT ... FOR UPDATE/SHARE is not allowed in a read-only query");
    }
}

function firstLine(message) {
    return String(message ?? "unknown error").split("\n")[0];
}
