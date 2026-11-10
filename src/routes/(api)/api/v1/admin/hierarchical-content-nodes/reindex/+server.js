import { sql } from "#lib/server/pg.js";
import { problem } from "#lib/server/problem.js";
import { logger } from "#lib/server/logger.js";
import { requireAdminToken } from "../../_helpers.js";

const INDEX_NAME = "idx_hierarchical_content_nodes_bm25";
const TABLE_NAME = "hierarchical_content_nodes";

export async function POST(event) {
    const authError = requireAdminToken(event);
    if (authError) return authError;

    const startedAt = performance.now();

    try {
        logger.info({ index: INDEX_NAME }, "Reindexing BM25 index concurrently");
        await sql.unsafe(`REINDEX INDEX CONCURRENTLY ${INDEX_NAME}`);

        const [info] = await sql`
            SELECT mutable,
                   num_docs
              FROM paradedb.index_info(${INDEX_NAME}::regclass)
        `;

        const result = {
            index: INDEX_NAME,
            mutable: info.mutable,
            num_docs: Number(info.num_docs),
            duration_ms: Math.round(performance.now() - startedAt),
        };

        logger.info(result, "BM25 index reindexed");

        return Response.json({
            data: result,
            _links: {
                self: { href: "/api/v1/admin/hierarchical-content-nodes/reindex" },
            },
        });
    } catch (err) {
        // A failed REINDEX CONCURRENTLY may leave an invalid _ccnew index behind.
        const invalidIndexes = await sql`
            SELECT c.relname AS name
              FROM pg_index i
              JOIN pg_class c ON c.oid = i.indexrelid
             WHERE i.indrelid = ${TABLE_NAME}::regclass
               AND NOT i.indisvalid
        `.catch(() => []);

        const recovery = invalidIndexes.length
            ? ` Invalid indexes left behind: ${invalidIndexes.map((row) => row.name).join(", ")}. Drop them, then retry.`
            : "";

        logger.error({ err, index: INDEX_NAME, invalidIndexes }, "Failed to reindex BM25 index");

        return problem(500, `Failed to reindex ${INDEX_NAME}: ${err.message}.${recovery}`, event.request.url);
    }
}
