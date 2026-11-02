import { sql } from "#lib/server/pg.js";
import { problem } from "#lib/server/problem.js";
import { requireUser } from "#lib/server/require-user.js";

export async function GET(event) {
    const authError = requireUser(event);
    if (authError) return authError;

    const contacts = await sql`SELECT id, firstname, lastname, created_at FROM contacts ORDER BY id`;

    return Response.json({
        data: contacts,
        _links: {
            self: { href: "/api/v1/contacts" },
        },
    });
}

export async function POST(event) {
    const authError = requireUser(event);
    if (authError) return authError;

    const body = await event.request.json();
    const firstname = body?.firstname;
    const lastname = body?.lastname;

    if (!firstname || typeof firstname !== "string" || !firstname.trim()) {
        return problem(400, "firstname is required", "/api/v1/contacts");
    }

    const [contact] = await sql`
        INSERT INTO contacts (firstname, lastname)
        VALUES (${firstname.trim()}, ${lastname?.trim() || null})
        RETURNING id, firstname, lastname, created_at
    `;

    return Response.json(
        {
            data: contact,
            _links: {
                self: { href: `/api/v1/contacts/${contact.id}` },
            },
        },
        {
            status: 201,
            headers: { Location: `/api/v1/contacts/${contact.id}` },
        },
    );
}
