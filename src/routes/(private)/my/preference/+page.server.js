import { redirect } from "@sveltejs/kit";
import { sql } from "#lib/server/pg.js";

export function load(event) {
    return {
        user: event.locals.user,
    };
}

export const actions = {
    default: async ({ request, cookies, locals }) => {
        const data = await request.formData();
        const language = data.get("language");

        if (language && locals.user) {
            await sql`UPDATE users SET locale = ${language} WHERE id = ${locals.user.id}`;
            cookies.set("locale", language, { path: "/", maxAge: 34560000, sameSite: "lax", httpOnly: false });
        }

        throw redirect(303, "/my/preference/");
    },
};
