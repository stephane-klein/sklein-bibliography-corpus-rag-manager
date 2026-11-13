import { error } from "@sveltejs/kit";
import { renderMarkdown } from "#lib/server/markdown.js";
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

    // The raw Markdown does not reach the browser: only its rendering does.
    const { content, ...node } = contentNode;

    // The page already shows the title as its heading, and every leaf starts
    // with the same heading again.
    const body = (content ?? "").replace(/^\s*#\s+[^\n]*\r?\n/, "");

    return {
        contentNode: node,
        children,
        contentHtml: node.is_container ? "" : renderMarkdown(body),
    };
}
