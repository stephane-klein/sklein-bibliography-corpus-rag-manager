import { logger } from "#lib/server/logger.js";
import { sql } from "#lib/server/pg.js";
import { resultMetaFor, toolArgumentsFor } from "#lib/server/mcp/log-fields.js";

export async function recordMcpAccess({
    toolName,
    sessionId,
    tokenId,
    userId,
    clientName,
    clientVersion,
    ip,
    query,
    purpose,
    toolArguments = {},
    success,
    errorStage,
    durationMs,
    embeddingMs,
    embeddingModel,
    vectorizeCalls,
    vectorizeCacheHits,
    embeddingTokens,
    embeddingCostUsd,
    inputChars,
    outputChars,
    resultCount = null,
    resultTotal = null,
    resultMeta = {},
    truncated,
}) {
    const safeToolArguments = toolArgumentsFor(toolName, toolArguments);
    const safeResultMeta = resultMetaFor(resultMeta);
    const safeResultCount = Number.isInteger(resultCount) && resultCount >= 0 ? resultCount : null;
    const safeResultTotal = Number.isInteger(resultTotal) && resultTotal >= 0 ? resultTotal : null;

    try {
        await sql`
            INSERT INTO mcp_access_log (
                tool_name,
                session_id,
                token_id,
                user_id,
                client_name,
                client_version,
                ip,
                query,
                purpose,
                tool_arguments,
                success,
                error_stage,
                duration_ms,
                embedding_ms,
                embedding_model,
                vectorize_calls,
                vectorize_cache_hits,
                embedding_tokens,
                embedding_cost_usd,
                input_chars,
                output_chars,
                result_count,
                result_total,
                result_meta,
                truncated
            )
            VALUES (
                ${toolName},
                ${sessionId ?? null},
                ${tokenId ?? null},
                ${userId ?? null},
                ${clientName ?? null},
                ${clientVersion ?? null},
                ${ip ?? null},
                ${query},
                ${purpose ?? null},
                ${JSON.stringify(safeToolArguments)}::jsonb,
                ${success},
                ${errorStage ?? null},
                ${durationMs ?? null},
                ${embeddingMs ?? null},
                ${embeddingModel ?? null},
                ${vectorizeCalls ?? 0},
                ${vectorizeCacheHits ?? 0},
                ${embeddingTokens ?? 0},
                ${embeddingCostUsd ?? 0},
                ${inputChars ?? null},
                ${outputChars ?? null},
                ${safeResultCount},
                ${safeResultTotal},
                ${JSON.stringify(safeResultMeta)}::jsonb,
                ${truncated ?? false}
            )
        `;
    } catch (err) {
        // The audit log must never turn a successful query into a failed tool
        // call, and a failed query must not hide the original error.
        logger.error({ err }, "Failed to record MCP access");
    }
}

export async function getMcpAccessLogPageData({ from, to, page = 1, pageSize = 100, userId }) {
    const offset = (page - 1) * pageSize;

    const conditions = [sql`l.user_id = ${userId}`];

    if (from) conditions.push(sql`l.created_at >= ${from}::date`);
    if (to) conditions.push(sql`l.created_at < (${to}::date + INTERVAL '1 day')`);

    const where = conditions.reduce((acc, condition) => sql`${acc} AND ${condition}`);

    const [rows, [totals]] = await Promise.all([
        sql`
            SELECT l.id,
                   l.created_at,
                   l.tool_name,
                   l.token_id,
                   t.name AS token_name,
                   l.client_name,
                   l.client_version,
                   l.ip,
                   l.purpose,
                   l.query,
                   l.tool_arguments,
                   l.success,
                   l.error_stage,
                   l.duration_ms,
                   l.embedding_ms,
                   l.embedding_model,
                   l.vectorize_calls,
                   l.vectorize_cache_hits,
                   l.embedding_tokens,
                   l.embedding_cost_usd::float8 AS embedding_cost_usd,
                   l.input_chars,
                   l.output_chars,
                   l.result_count,
                   l.result_total,
                   l.result_meta,
                   l.truncated
              FROM mcp_access_log l
              LEFT JOIN api_tokens t ON t.id = l.token_id
             WHERE ${where}
             ORDER BY l.created_at DESC
             LIMIT ${pageSize} OFFSET ${offset}
        `,
        sql`
            SELECT count(*)::int AS total,
                   coalesce(sum(vectorize_calls), 0)::int AS vectorize_calls,
                   coalesce(sum(vectorize_cache_hits), 0)::int AS vectorize_cache_hits,
                   coalesce(sum(embedding_tokens), 0)::int AS embedding_tokens,
                   coalesce(sum(embedding_cost_usd), 0)::float8 AS embedding_cost_usd
              FROM mcp_access_log l
             WHERE ${where}
        `,
    ]);

    return {
        rows,
        total: totals.total,
        totals: {
            vectorizeCalls: totals.vectorize_calls,
            vectorizeCacheHits: totals.vectorize_cache_hits,
            embeddingTokens: totals.embedding_tokens,
            embeddingCostUsd: totals.embedding_cost_usd,
        },
        page,
        pageCount: Math.ceil(totals.total / pageSize),
        from,
        to,
    };
}
