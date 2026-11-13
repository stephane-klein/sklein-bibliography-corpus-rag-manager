import { error } from "@sveltejs/kit";
import { renderMarkdown } from "#lib/server/markdown.js";
import { sql } from "#lib/server/pg.js";
import { loadOutline } from "#lib/server/book-outline.js";
import { getEmbeddingModel } from "#lib/server/embedding.js";

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

    // A container has no text of its own: its page is the table of contents of
    // everything below it, in one query instead of one per level.
    const outline = contentNode.is_container ? await loadOutline(contentNode.id) : null;

    // The raw Markdown does not reach the browser: only its rendering does.
    const { content, ...node } = contentNode;

    // The page already shows the title as its heading, and every leaf starts
    // with the same heading again.
    const body = (content ?? "").replace(/^\s*#\s+[^\n]*\r?\n/, "");

    return {
        contentNode: node,
        outline,
        embeddingModel: getEmbeddingModel(),
        contentHtml: node.is_container ? "" : renderMarkdown(body),
    };
}
