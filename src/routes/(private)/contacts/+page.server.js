import { sql } from "#lib/server/pg.js";

const PAGE_SIZE = 25;

export async function load(event) {
    const page = Math.max(1, parseInt(event.url.searchParams.get("page") || "1", 10));
    const offset = (page - 1) * PAGE_SIZE;

    const [contacts, countResult] = await Promise.all([
        sql`SELECT id, firstname, lastname, created_at
              FROM contacts
             ORDER BY id
             LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
        sql`SELECT count(*)::int AS total FROM contacts`,
    ]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return {
        contacts,
        page,
        totalPages,
    };
}
