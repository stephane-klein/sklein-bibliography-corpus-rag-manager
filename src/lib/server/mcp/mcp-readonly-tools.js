import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { getEmbeddingInfo } from "#lib/server/embedding.js";
import { logger } from "#lib/server/logger.js";
import { recordMcpAccess } from "#lib/server/mcp-access-log.js";
import {
    DEFAULT_MAX_OUTPUT_CHARS,
    MAX_OUTPUT_CHARS,
    MAX_QUERY_CHARS,
    MAX_VECTORIZE_TEXTS,
    MAX_VECTORIZE_TEXT_CHARS,
} from "./config.js";
import { getQueryEmbeddings } from "./query-embeddings.js";
import { getReadOnlyTablesSchema, sqlReadonly } from "./mcp-readonly-db.js";
import {
    applyVectorizeVectors,
    assertReadOnlySingleStatement,
    extractVectorizeTexts,
    VectorizeSqlError,
} from "./vectorize-sql.js";

const TOOL_NAME = "readOnlySqlQuery";

export async function createMcpReadonlyServer({ context }) {
    const schema = await getReadOnlyTablesSchema();
    const embeddingInfo = readEmbeddingInfo();
    const server = new Server(
        { name: "sklein-bibliography-corpus-rag-manager-mcp-readonly", version: "1.0.0" },
        { capabilities: { tools: {} } },
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: TOOL_NAME,
                description:
                    "Read-only access to the bibliography corpus: " +
                    "documents (hierarchical_content_nodes) and their paragraph-level chunks " +
                    "(content_chunks), including the semantic embeddings, to answer questions " +
                    "about the corpus and find passages by BM25 or semantic similarity.\n" +
                    `Available tables:\n${schema}\n` +
                    "Semantics and tips:\n" +
                    "  - hierarchical_content_nodes has one row per Markdown document: nanoid, slug, title,\n" +
                    "    authors (text[]), source_url, original_published_date (YYYY[-MM[-DD]] text), content,\n" +
                    "    metadata, markdown_source_file.\n" +
                    "  - content_chunks has one row per paragraph: content_node_id, chunk_index, heading_path,\n" +
                    "    content, embedding, embedding_model, embedding_dimension, embedding_strategy,\n" +
                    "    embedding_input_format, embedding_input_type.\n" +
                    "  - Join them with content_chunks.content_node_id = hierarchical_content_nodes.id.\n" +
                    "  - For an excerpt, use left(content, 500) instead of the full content column.\n" +
                    "  - BM25 search: WHERE content @@@ pdb.parse('terms', lenient => true); rank with\n" +
                    "    ORDER BY pdb.score(id) DESC.\n" +
                    embeddingTips(embeddingInfo) +
                    "  - Only one SELECT, WITH ... SELECT or EXPLAIN SELECT statement is allowed per call.\n" +
                    "  - Use purpose to say why the query is run; it is recorded in the access log.\n" +
                    vectorSearchSection(embeddingInfo),
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The read-only SQL query to execute",
                        },
                        purpose: {
                            type: "string",
                            description: "Describe the purpose of this query in under 400 characters.",
                            maxLength: 400,
                        },
                        maxCharacters: {
                            type: "integer",
                            minimum: 1,
                            description:
                                `Optional cap on the number of characters returned, so large results ` +
                                `are truncated. Defaults to ${DEFAULT_MAX_OUTPUT_CHARS}. ` +
                                "Prefer adding LIMIT or narrowing the filter to get the full data.",
                        },
                    },
                    required: ["query", "purpose"],
                },
            },
        ],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args = {} } = request.params;

        if (name !== TOOL_NAME) {
            return errorResponse(`Unknown tool: ${name}`);
        }

        if (typeof args.query !== "string" || args.query.trim().length === 0) {
            return errorResponse("The 'query' field is required and must be a non-empty string.");
        }

        if (args.query.length > MAX_QUERY_CHARS) {
            return errorResponse(`The query is longer than the ${MAX_QUERY_CHARS} character limit.`);
        }

        if (typeof args.purpose !== "string" || args.purpose.length === 0 || args.purpose.length > 400) {
            return errorResponse("The 'purpose' field is required and must be 1 to 400 characters.");
        }

        if (!sqlReadonly) {
            return errorResponse("MCP read-only access is disabled because the reader role is not configured.");
        }

        const clientInfo = server.getClientVersion?.() ?? {};
        const startedAt = Date.now();
        const originalQuery = args.query;
        const cap = Math.min(
            Number.isInteger(args.maxCharacters) && args.maxCharacters > 0
                ? args.maxCharacters
                : DEFAULT_MAX_OUTPUT_CHARS,
            MAX_OUTPUT_CHARS,
        );

        let result;
        let success = false;
        let errorStage = null;
        let truncated = false;
        let outputChars = 0;
        let embedding = { ms: null, model: null, calls: 0, cacheHits: 0, tokens: 0, costUsd: 0 };
        let response = null;

        try {
            const { ast, texts } = await extractVectorizeTexts(originalQuery);
            assertReadOnlySingleStatement(ast);

            const uniqueTexts = [...new Set(texts)];

            if (uniqueTexts.length > MAX_VECTORIZE_TEXTS) {
                throw new VectorizeSqlError(
                    `At most ${MAX_VECTORIZE_TEXTS} distinct vectorize() calls are allowed; got ${uniqueTexts.length}.`,
                );
            }

            for (const text of uniqueTexts) {
                if (text.length > MAX_VECTORIZE_TEXT_CHARS) {
                    throw new VectorizeSqlError(
                        `vectorize() text is limited to ${MAX_VECTORIZE_TEXT_CHARS} characters; got ${text.length}.`,
                    );
                }
            }

            let sql = originalQuery;

            if (uniqueTexts.length > 0) {
                const embeddings = await getQueryEmbeddings(uniqueTexts);
                embedding = {
                    ms: embeddings.ms,
                    model: embeddings.model,
                    calls: embeddings.calls,
                    cacheHits: embeddings.cacheHits,
                    tokens: embeddings.tokens,
                    costUsd: embeddings.costUsd,
                };
                sql = await applyVectorizeVectors(ast, embeddings.vectors);
            }

            result = await sqlReadonly.begin(async (tx) => {
                await tx`SET TRANSACTION READ ONLY`;
                await tx`SET LOCAL statement_timeout = '10s'`;
                await tx`SET LOCAL idle_in_transaction_session_timeout = '10s'`;
                return await tx.unsafe(sql, []);
            });

            success = true;
        } catch (err) {
            errorStage = err.stage ?? "database";
            response = errorResponse(
                errorStage === "database"
                    ? `Query failed: ${boundedMessage(err)}. Re-run with a narrower filter or check the SQL.`
                    : boundedMessage(err),
            );
            logger.warn({ err, toolName: TOOL_NAME }, "MCP read-only query failed");
        } finally {
            if (success) {
                const text = JSON.stringify(result, null, 2) ?? "null";
                outputChars = text.length;
                truncated = text.length > cap;
                response = {
                    content: [
                        {
                            type: "text",
                            text: truncated
                                ? `${text.slice(0, cap)}\n\n[... truncated: showing ${cap} of ${text.length} chars — ` +
                                  "re-run with LIMIT or a narrower filter to see the rest]"
                                : text,
                        },
                    ],
                };
            }

            await recordMcpAccess({
                toolName: TOOL_NAME,
                sessionId: context.sessionId,
                tokenId: context.tokenId,
                userId: context.userId,
                clientName: clientInfo.name,
                clientVersion: clientInfo.version,
                ip: context.ip,
                query: originalQuery,
                purpose: args.purpose,
                success,
                errorStage,
                durationMs: Date.now() - startedAt,
                embeddingMs: embedding.ms,
                embeddingModel: embedding.model,
                vectorizeCalls: embedding.calls,
                vectorizeCacheHits: embedding.cacheHits,
                embeddingTokens: embedding.tokens,
                embeddingCostUsd: embedding.costUsd,
                inputChars: originalQuery.length,
                outputChars,
                truncated,
            });
        }

        return response;
    });

    return server;
}

function readEmbeddingInfo() {
    try {
        return getEmbeddingInfo();
    } catch {
        return null;
    }
}

function embeddingTips(info) {
    if (!info) {
        return "  - Full-text search uses BM25; vectorize() is not available right now.\n";
    }

    return (
        `  - Document chunks use the ${info.model} model, dimension ${info.dimension}.\n` +
        `  - vectorize() uses the ${info.query_model} query model, dimension ${info.dimension}.\n`
    );
}

function vectorSearchSection(info) {
    if (!info) {
        return (
            "Vector search:\n" +
            "  - vectorize() is unavailable until the embedding provider is configured.\n" +
            "  - Use BM25 instead: WHERE content @@@ pdb.parse('terms', lenient => true).\n" +
            "Example (BM25):\n" +
            "  SELECT n.nanoid, n.title, left(n.content, 500) AS excerpt\n" +
            "    FROM hierarchical_content_nodes n\n" +
            "   WHERE n.content @@@ pdb.parse('condorcet', lenient => true)\n" +
            "   ORDER BY pdb.score(n.id) DESC\n" +
            "   LIMIT 10;"
        );
    }

    return (
        "Vector search:\n" +
        "  - vectorize('some text') is a virtual function provided by this server. It returns\n" +
        "    a vector for the text. The server replaces the call with the actual vector before\n" +
        "    executing the query; PostgreSQL never sees a vectorize() function.\n" +
        "  - The argument MUST be one SQL string literal, e.g. vectorize('le principe de condorcet').\n" +
        "    Column references and expressions are rejected: the server cannot know their value\n" +
        "    before the query runs. Read the text with one query, then call again with the literal.\n" +
        `  - At most ${MAX_VECTORIZE_TEXTS} distinct texts per query; identical texts are embedded once.\n` +
        `  - At most ${MAX_VECTORIZE_TEXT_CHARS} characters per text.\n` +
        "  - Use the cosine distance operator <=>: lower is closer.\n" +
        "  - Do not SELECT the vector itself; it is 1024 numbers and will be truncated.\n" +
        "Example (semantic search):\n" +
        "  SELECT c.content_node_id, n.title, c.heading_path,\n" +
        "         left(c.content, 500) AS excerpt,\n" +
        "         c.embedding <=> vectorize('le principe de condorcet') AS distance\n" +
        "    FROM content_chunks c\n" +
        "    JOIN hierarchical_content_nodes n ON n.id = c.content_node_id\n" +
        "   WHERE c.embedding IS NOT NULL" +
        ` AND c.embedding_model = '${info.model}'` +
        " AND c.embedding_strategy = 'standard'\n" +
        "   ORDER BY distance\n" +
        "   LIMIT 10;"
    );
}

function errorResponse(message) {
    return {
        content: [{ type: "text", text: message }],
        isError: true,
    };
}

function boundedMessage(err) {
    const message = err instanceof Error ? err.message : String(err);
    return message.length > 1000 ? `${message.slice(0, 1000)}...` : message;
}
