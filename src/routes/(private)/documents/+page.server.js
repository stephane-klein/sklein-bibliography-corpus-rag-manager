import { sql } from "#lib/server/pg.js";

const PAGE_SIZE = 25;
const MAX_QUERY_LENGTH = 200;

export async function load(event) {
    const q = (event.url.searchParams.get("q") ?? "").replaceAll("\u0000", "").trim().slice(0, MAX_QUERY_LENGTH);
    const requestedPage = Number.parseInt(event.url.searchParams.get("page") ?? "1", 10);

    const isSearch = q.length > 0;
    const where = isSearch ? sql`WHERE content @@@ pdb.parse(${q}, lenient => true)` : sql``;
    const order = isSearch
        ? sql`ORDER BY pdb.score(id) DESC, id ASC`
        : sql`ORDER BY original_published_date DESC NULLS LAST, id DESC`;

    const [{ total }] = await sql`
        SELECT count(*)::int AS total
          FROM hierarchical_content_nodes
          ${where}
    `;

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const page = totalPages > 0 ? Math.min(Math.max(1, requestedPage || 1), totalPages) : 1;
    const offset = (page - 1) * PAGE_SIZE;

    const documents = await sql`
        SELECT nanoid, title, authors, original_published_date, source_url
          FROM hierarchical_content_nodes
          ${where}
          ${order}
         LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `;

    return {
        documents,
        page,
        total,
        totalPages,
        q,
    };
}
