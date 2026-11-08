import { redirect } from "@sveltejs/kit";
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
    default: async ({ params }) => {
        const nanoid = params.nanoid;

        await sql`DELETE FROM contacts WHERE nanoid = ${nanoid}`;

        throw redirect(302, "/contacts");
    },
};
