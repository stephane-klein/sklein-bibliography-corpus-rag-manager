import { error } from "@sveltejs/kit";
import { sql } from "#lib/server/pg.js";

export async function load({ params }) {
    const [contentNode] = await sql`
        SELECT title, authors, original_published_date, source_url, content
          FROM hierarchical_content_nodes
         WHERE nanoid = ${params.nanoid}
    `;

    if (!contentNode) {
        error(404, "Document not found");
    }

    return {
        contentNode,
    };
}
