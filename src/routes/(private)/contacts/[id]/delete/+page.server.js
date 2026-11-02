import { redirect } from "@sveltejs/kit";
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
    default: async ({ params }) => {
        const id = params.id;

        await sql`DELETE FROM contacts WHERE id = ${id}`;

        throw redirect(302, "/contacts");
    },
};
