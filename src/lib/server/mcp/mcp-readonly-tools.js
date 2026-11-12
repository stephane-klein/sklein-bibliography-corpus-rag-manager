import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { searchDocuments } from "#lib/server/document-search.js";
import { getEmbeddingInfo } from "#lib/server/embedding.js";
import { logger } from "#lib/server/logger.js";
import { recordMcpAccess } from "#lib/server/mcp-access-log.js";
import { buildLargeReadWarning, buildSemanticNextStep } from "#lib/server/search-diagnostics.js";
import {
    DEFAULT_MAX_OUTPUT_CHARS,
    LARGE_RESULT_ROWS,
    MAX_OUTPUT_CHARS,
    MAX_QUERY_CHARS,
    MAX_VECTORIZE_TEXTS,
    MAX_VECTORIZE_TEXT_CHARS,
} from "./config.js";
import { getQueryEmbeddings } from "./query-embeddings.js";
import { getReadOnlyTablesSchema, sqlReadonly } from "./mcp-readonly-db.js";
import { clampInteger, normalizeWords, toSemanticResult } from "./semantic-search.js";
import {
    applyVectorizeVectors,
    assertReadOnlySingleStatement,
    extractVectorizeTexts,
    VectorizeSqlError,
} from "./vectorize-sql.js";

const TOOL_NAME = "readOnlySqlQuery";
const SEMANTIC_TOOL_NAME = "semanticSearch";
const MAX_SEMANTIC_QUERY_CHARS = 2000;
const MAX_SEMANTIC_RESULTS = 20;
const DEFAULT_SEMANTIC_RESULTS = 10;

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
                    "  - When reading passages, filter on content_node_id and chunk_index from\n" +
                    "    semanticSearch. Do not select every chunk of a document; large reads are\n" +
                    "    truncated and trigger a warning.\n" +
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
            {
                name: SEMANTIC_TOOL_NAME,
                description:
                    "Search the bibliography corpus by meaning. This tool runs BM25 over documents " +
                    "and vector search over paragraph chunks, fuses the rankings with Reciprocal Rank " +
                    "Fusion, and returns the best matching passage for each document.\n" +
                    "Use it first for questions like 'what does this author say about X?'. Then read " +
                    "only the returned passages with readOnlySqlQuery, using content_node_id and " +
                    "chunk_index. Do not select every chunk of a document.\n" +
                    "Each result contains content_node_id, nanoid, title, authors, " +
                    "original_published_date, source_url, chunk_index, heading_path, excerpt, " +
                    "distance, bm25_rank, vector_rank and rrf.\n" +
                    "Filters: authors and title match all words, accent- and case-insensitively.\n" +
                    (embeddingInfo
                        ? `The query embedding uses ${embeddingInfo.query_model}; the chunks use ${embeddingInfo.model}.\n`
                        : "Semantic search falls back to BM25 when the embedding provider is unavailable.\n"),
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Natural language question or keywords",
                        },
                        authors: {
                            anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
                            description: "Optional author name(s); all words must match",
                        },
                        title: {
                            type: "string",
                            description: "Optional title words; all words must match",
                        },
                        page: {
                            type: "integer",
                            minimum: 1,
                            description: "Optional page, default 1",
                        },
                        limit: {
                            type: "integer",
                            minimum: 1,
                            maximum: MAX_SEMANTIC_RESULTS,
                            description:
                                `Optional number of documents per page, default ${DEFAULT_SEMANTIC_RESULTS}, ` +
                                `max ${MAX_SEMANTIC_RESULTS}`,
                        },
                        maxCharacters: {
                            type: "integer",
                            minimum: 1,
                            description: `Optional cap on the number of characters returned. Defaults to ${DEFAULT_MAX_OUTPUT_CHARS}.`,
                        },
                        purpose: {
                            type: "string",
                            description: "Describe the purpose of this search in under 400 characters.",
                            maxLength: 400,
                        },
                    },
                    required: ["query", "purpose"],
                },
            },
        ],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args = {} } = request.params;

        if (name === SEMANTIC_TOOL_NAME) {
            return handleSemanticSearch(args, context, server);
        }

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
        const toolArguments = {
            maxCharacters: Number.isInteger(args.maxCharacters) ? args.maxCharacters : null,
        };

        let result;
        let success = false;
        let errorStage = null;
        let truncated = false;
        let outputChars = 0;
        let resultCount = null;
        let resultTotal = null;
        let resultMeta = {};
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
                resultCount = Array.isArray(result) ? result.length : result == null ? 0 : 1;
                resultTotal = resultCount;
                truncated = text.length > cap;

                const warning = buildLargeReadWarning({
                    query: originalQuery,
                    resultCount,
                    threshold: LARGE_RESULT_ROWS,
                });
                const warningNote = warning ? `\n\n[... warning: ${warning}]` : "";

                if (warning) resultMeta = { warning: "large_chunk_read" };

                response = {
                    content: [
                        {
                            type: "text",
                            text: truncated
                                ? `${text.slice(0, cap)}\n\n[... truncated: showing ${cap} of ${text.length} chars — ` +
                                  `re-run with LIMIT or a narrower filter to see the rest]${warningNote}`
                                : `${text}${warningNote}`,
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
                toolArguments,
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
                resultCount,
                resultTotal,
                resultMeta,
                truncated,
            });
        }

        return response;
    });

    return server;
}

async function handleSemanticSearch(args, context, server) {
    if (typeof args.query !== "string" || args.query.trim().length === 0) {
        return errorResponse("The 'query' field is required and must be a non-empty string.");
    }

    if (args.query.length > MAX_SEMANTIC_QUERY_CHARS) {
        return errorResponse(`The query is longer than the ${MAX_SEMANTIC_QUERY_CHARS} character limit.`);
    }

    if (typeof args.purpose !== "string" || args.purpose.length === 0 || args.purpose.length > 400) {
        return errorResponse("The 'purpose' field is required and must be 1 to 400 characters.");
    }

    const clientInfo = server.getClientVersion?.() ?? {};
    const startedAt = Date.now();
    const query = args.query.trim();
    const page = clampInteger(args.page, { fallback: 1, min: 1, max: 1000 });
    const limit = clampInteger(args.limit, {
        fallback: DEFAULT_SEMANTIC_RESULTS,
        min: 1,
        max: MAX_SEMANTIC_RESULTS,
    });
    const cap = Math.min(
        Number.isInteger(args.maxCharacters) && args.maxCharacters > 0 ? args.maxCharacters : DEFAULT_MAX_OUTPUT_CHARS,
        MAX_OUTPUT_CHARS,
    );
    const toolArguments = {
        authors: args.authors ?? null,
        title: args.title ?? null,
        limit,
        page,
        maxCharacters: Number.isInteger(args.maxCharacters) ? args.maxCharacters : null,
    };

    let success = false;
    let errorStage = null;
    let truncated = false;
    let outputChars = 0;
    let resultCount = null;
    let resultTotal = null;
    let resultMeta = {};
    let response;
    let embedding = { ms: null, model: null, calls: 0, cacheHits: 0, tokens: 0, costUsd: 0 };

    try {
        const result = await searchDocuments({
            q: query,
            authorWords: normalizeWords(args.authors),
            titleWords: normalizeWords(args.title),
            semantic: true,
            requestedPage: page,
            pageSize: limit,
        });

        if (result.semanticMeta) {
            embedding = {
                ms: result.semanticMeta.embeddingMs ?? null,
                model: result.semanticMeta.model ?? null,
                calls: result.semanticMeta.source === "provider" ? 1 : 0,
                cacheHits: result.semanticMeta.source === "cache" ? 1 : 0,
                tokens: result.semanticMeta.tokens ?? 0,
                costUsd: result.semanticMeta.costUsd ?? 0,
            };
        }

        const filters = {
            authors: args.authors ?? null,
            title: args.title ?? null,
        };
        const payload = {
            query,
            filters,
            page: result.page,
            total: result.total,
            total_pages: result.totalPages,
            hybrid: result.hybrid,
            semantic_error: result.semanticError ?? null,
            semantic_diagnostics: result.diagnostics ?? null,
            next_step: buildSemanticNextStep({
                total: result.total,
                semanticError: result.semanticError,
                diagnostics: result.diagnostics,
                filters,
            }),
            documents: result.documents.slice(0, limit).map((document) => toSemanticResult(document)),
        };

        resultCount = payload.documents.length;
        resultTotal = payload.total;
        resultMeta = {
            hybrid: payload.hybrid,
            semantic_error: payload.semantic_error,
            semantic_source: result.semanticMeta?.source ?? null,
            total_pages: payload.total_pages,
            semantic_diagnostics: payload.semantic_diagnostics,
        };

        const text = JSON.stringify(payload, null, 2) ?? "null";
        outputChars = text.length;
        truncated = text.length > cap;

        response = {
            content: [
                {
                    type: "text",
                    text: truncated
                        ? `${text.slice(0, cap)}\n\n[... truncated: showing ${cap} of ${text.length} chars — ` +
                          "reduce 'limit' or add filters]"
                        : text,
                },
            ],
        };
        success = true;
    } catch (err) {
        errorStage = err.stage ?? "database";
        response = errorResponse(
            errorStage === "database"
                ? `Semantic search failed: ${boundedMessage(err)}. Re-run with a narrower query or check the database.`
                : boundedMessage(err),
        );
        logger.warn({ err, toolName: SEMANTIC_TOOL_NAME }, "MCP semantic search failed");
    } finally {
        await recordMcpAccess({
            toolName: SEMANTIC_TOOL_NAME,
            sessionId: context.sessionId,
            tokenId: context.tokenId,
            userId: context.userId,
            clientName: clientInfo.name,
            clientVersion: clientInfo.version,
            ip: context.ip,
            query,
            purpose: args.purpose,
            toolArguments,
            success,
            errorStage,
            durationMs: Date.now() - startedAt,
            embeddingMs: embedding.ms,
            embeddingModel: embedding.model,
            vectorizeCalls: embedding.calls,
            vectorizeCacheHits: embedding.cacheHits,
            embeddingTokens: embedding.tokens,
            embeddingCostUsd: embedding.costUsd,
            inputChars: query.length,
            outputChars,
            resultCount,
            resultTotal,
            resultMeta,
            truncated,
        });
    }

    return response;
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
