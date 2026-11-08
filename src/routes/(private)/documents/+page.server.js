import { sql } from "#lib/server/pg.js";

const PAGE_SIZE = 25;

export async function load(event) {
    const requestedPage = Number.parseInt(event.url.searchParams.get("page") ?? "1", 10);
    const [{ total }] = await sql`SELECT count(*)::int AS total FROM hierarchical_content_nodes`;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const page = totalPages > 0 ? Math.min(Math.max(1, requestedPage || 1), totalPages) : 1;
    const offset = (page - 1) * PAGE_SIZE;

    const documents = await sql`
        SELECT nanoid, title, authors, original_published_date, source_url
          FROM hierarchical_content_nodes
         ORDER BY original_published_date DESC NULLS LAST, id DESC
         LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `;

    return {
        documents,
        page,
        total,
        totalPages,
    };
}
