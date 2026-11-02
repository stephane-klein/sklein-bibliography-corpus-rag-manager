import { redirect, fail } from "@sveltejs/kit";
import { hashPassword, generateId } from "#lib/server/auth.js";
import { sql } from "#lib/server/pg.js";

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const email = data.get("email");
        const displayName = data.get("display-name");
        const password = data.get("password");

        if (!email || !password) {
            return fail(400, { error: "Email and password are required." });
        }

        if (password.length < 12) {
            return fail(400, { error: "Password must be at least 12 characters." });
        }

        const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`;

        if (existing) {
            return fail(400, { error: "An account with this email already exists." });
        }

        const id = generateId();
        const passwordHash = await hashPassword(password);
        const name = displayName || email;

        await sql`INSERT INTO users (id, email, display_name, password_hash)
                  VALUES (${id}, ${email}, ${name}, ${passwordHash})`;

        throw redirect(302, "/login");
    },
};
