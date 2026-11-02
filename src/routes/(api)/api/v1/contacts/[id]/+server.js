import { sql } from "#lib/server/pg.js";
import { problem } from "#lib/server/problem.js";
import { requireUser } from "#lib/server/require-user.js";

function contactLinks(id) {
    return {
        self: { href: `/api/v1/contacts/${id}` },
        collection: { href: "/api/v1/contacts" },
    };
}

export async function GET(event) {
    const authError = requireUser(event);
    if (authError) return authError;

    const [contact] = await sql`SELECT id, firstname, lastname, created_at FROM contacts WHERE id = ${event.params.id}`;

    if (!contact) return problem(404, "Contact not found", event.request.url);

    return Response.json({
        data: contact,
        _links: contactLinks(contact.id),
    });
}

export async function PATCH(event) {
    const authError = requireUser(event);
    if (authError) return authError;

    const [existing] = await sql`SELECT id FROM contacts WHERE id = ${event.params.id}`;

    if (!existing) return problem(404, "Contact not found", event.request.url);

    const body = await event.request.json();

    if (body.firstname !== undefined && (typeof body.firstname !== "string" || !body.firstname.trim())) {
        return problem(422, "firstname must be a non-empty string", event.request.url);
    }

    if (body.lastname !== undefined && body.lastname !== null && typeof body.lastname !== "string") {
        return problem(422, "lastname must be a string or null", event.request.url);
    }

    const [contact] = await sql`
        UPDATE contacts
        SET firstname = COALESCE(${body.firstname?.trim() || null}, firstname),
            lastname  = COALESCE(${body.lastname?.trim() || null}, lastname)
        WHERE id = ${event.params.id}
        RETURNING id, firstname, lastname, created_at
    `;

    return Response.json({
        data: contact,
        _links: contactLinks(contact.id),
    });
}

export async function DELETE(event) {
    const authError = requireUser(event);
    if (authError) return authError;

    const [existing] = await sql`SELECT id FROM contacts WHERE id = ${event.params.id}`;

    if (!existing) return problem(404, "Contact not found", event.request.url);

    await sql`DELETE FROM contacts WHERE id = ${event.params.id}`;

    return new Response(null, { status: 204 });
}
