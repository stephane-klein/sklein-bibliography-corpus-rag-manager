import { sql } from "#lib/server/pg.js";
import { getEmbeddingModel } from "#lib/server/embedding.js";
import { sectionVectorizationState } from "#lib/server/vectorization.js";

// Reads the whole subtree under one content node, in the order the toc.yaml
// lists it, together with the chunk counts of every Markdown-backed section.
// One query returns the complete outline of a book, whatever its depth: the
// page then shows every chapter without asking the server again.
//
// The path array carries (position, id) per level, so two siblings keep the
// ORDER BY position, id of the importer, and a parent always sorts before its
// children.
export async function loadOutline(nodeId) {
    const embeddingModel = getEmbeddingModel();
    const rows = await sql`
        WITH RECURSIVE subtree AS (
            SELECT id, parent_id, nanoid, title, position,
                   markdown_source_file IS NOT NULL AS is_file,
                   markdown_source_file_estimate_token_count AS tokens,
                   ARRAY[position, id] AS path
              FROM hierarchical_content_nodes
             WHERE id = ${nodeId}
            UNION ALL
            SELECT child.id, child.parent_id, child.nanoid, child.title, child.position,
                   child.markdown_source_file IS NOT NULL,
                   child.markdown_source_file_estimate_token_count,
                   subtree.path || ARRAY[child.position, child.id]
              FROM hierarchical_content_nodes child
              JOIN subtree ON child.parent_id = subtree.id
        )
        SELECT subtree.id, subtree.parent_id, subtree.nanoid, subtree.title,
               subtree.is_file, subtree.tokens,
               stats.chunk_count, stats.ready_chunk_count, stats.embedded_chunk_count
          FROM subtree
          LEFT JOIN LATERAL (
              SELECT count(*)::int AS chunk_count,
                     count(*) FILTER (
                         WHERE chunk.embedding IS NOT NULL
                           AND chunk.embedding_model = ${embeddingModel}
                           AND chunk.embedding_strategy = 'standard'
                     )::int AS ready_chunk_count,
                     count(*) FILTER (WHERE chunk.embedding IS NOT NULL)::int AS embedded_chunk_count
                FROM content_chunks chunk
               WHERE chunk.content_node_id = subtree.id
          ) stats ON true
         ORDER BY subtree.path
    `;

    return buildOutline(rows, nodeId);
}

// Turns the flat rows of the query into a tree. Rows must arrive parents
// first, in reading order, which ORDER BY path guarantees.
export function buildOutline(rows, rootId) {
    const nodes = new Map(
        rows.map((row) => {
            const state = row.is_file
                ? sectionVectorizationState({
                      chunkCount: row.chunk_count,
                      readyChunkCount: row.ready_chunk_count,
                      embeddedChunkCount: row.embedded_chunk_count,
                  })
                : null;

            return [
                row.id,
                {
                    id: row.id,
                    nanoid: row.nanoid,
                    title: row.title,
                    isFile: row.is_file,
                    tokens: row.tokens,
                    state,
                    children: [],
                    // Totals cover the node and its descendants, so a part
                    // header shows how much of the book it holds without a
                    // second query.
                    totalTokens: row.tokens,
                    sectionCount: row.is_file ? 1 : 0,
                },
            ];
        }),
    );

    const root = nodes.get(rootId);

    if (!root) {
        return null;
    }

    for (const row of rows) {
        const parent = nodes.get(row.parent_id);

        if (parent) {
            parent.children.push(nodes.get(row.id));
        }
    }

    // Rows arrive parents first, so one reverse pass adds each child total to
    // its parent once the child has itself collected its descendants.
    for (const row of [...rows].reverse()) {
        const node = nodes.get(row.id);

        if (node === root) {
            continue;
        }

        const parent = nodes.get(row.parent_id);
        parent.totalTokens += node.totalTokens;
        parent.sectionCount += node.sectionCount;
    }

    return root;
}
