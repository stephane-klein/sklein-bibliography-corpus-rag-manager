import { redirect, fail } from "@sveltejs/kit";
import { sql } from "#lib/server/pg.js";

export async function load(event) {
    const id = event.params.id;

    const [contact] = await sql`SELECT id, firstname, lastname FROM contacts WHERE id = ${id}`;

    if (!contact) {
        throw redirect(302, "/contacts");
    }

    return { contact };
}

export const actions = {
    default: async ({ request, params }) => {
        const id = params.id;

        const data = await request.formData();
        const firstname = data.get("firstname");
        const lastname = data.get("lastname");

        if (!firstname || !lastname) {
            return fail(400, { error: "First name and last name are required." });
        }

        await sql`UPDATE contacts SET firstname = ${firstname}, lastname = ${lastname} WHERE id = ${id}`;

        throw redirect(302, "/contacts");
    },
};
