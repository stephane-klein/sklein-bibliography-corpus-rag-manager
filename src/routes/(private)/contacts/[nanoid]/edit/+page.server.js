import { redirect, fail } from "@sveltejs/kit";
import { sql } from "#lib/server/pg.js";

export async function load(event) {
    const nanoid = event.params.nanoid;

    const [contact] = await sql`SELECT firstname, lastname FROM contacts WHERE nanoid = ${nanoid}`;

    if (!contact) {
        throw redirect(302, "/contacts");
    }

    return { contact };
}

export const actions = {
    default: async ({ request, params }) => {
        const nanoid = params.nanoid;

        const data = await request.formData();
        const firstname = data.get("firstname");
        const lastname = data.get("lastname");

        if (!firstname || !lastname) {
            return fail(400, { error: "First name and last name are required." });
        }

        await sql`UPDATE contacts SET firstname = ${firstname}, lastname = ${lastname} WHERE nanoid = ${nanoid}`;

        throw redirect(302, "/contacts");
    },
};
