import { redirect } from "@sveltejs/kit";
import { invalidateSession, SESSION_COOKIE_NAME } from "#lib/server/auth.js";

export function load({ cookies }) {
    const sessionId = cookies.get(SESSION_COOKIE_NAME);

    if (sessionId) {
        invalidateSession(sessionId);
    }

    cookies.delete(SESSION_COOKIE_NAME, { path: "/" });

    throw redirect(302, "/");
}
