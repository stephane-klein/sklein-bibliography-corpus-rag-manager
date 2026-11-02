import { problem } from "#lib/server/problem.js";

export function requireUser(event) {
    if (!event.locals.user) {
        return problem(
            401,
            event.locals.authFailure === "expired" ? "API token expired" : "Authentication required",
            event.request.url,
        );
    }

    return null;
}
