import { redirect, fail } from "@sveltejs/kit";
import { sql } from "#lib/server/pg.js";

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const firstname = data.get("firstname");
        const lastname = data.get("lastname");

        if (!firstname || !lastname) {
            return fail(400, { error: "First name and last name are required." });
        }

        await sql`INSERT INTO contacts (firstname, lastname) VALUES (${firstname}, ${lastname})`;

        throw redirect(302, "/contacts");
    },
};
