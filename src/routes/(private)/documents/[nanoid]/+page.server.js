import { error } from "@sveltejs/kit";
import { sql } from "#lib/server/pg.js";

export async function load({ params }) {
    const [contentNode] = await sql`
        SELECT id, title, authors, original_published_date, source_url, source_kind, content,
               markdown_source_file IS NULL AS is_container
          FROM hierarchical_content_nodes
         WHERE nanoid = ${params.nanoid}
    `;

    if (!contentNode) {
        error(404, "Document not found");
    }

    const children = contentNode.is_container
        ? await sql`
              SELECT nanoid, title, markdown_source_file IS NULL AS is_container
                FROM hierarchical_content_nodes
               WHERE parent_id = ${contentNode.id}
               ORDER BY position, id
          `
        : [];

    return {
        contentNode,
        children,
    };
}
