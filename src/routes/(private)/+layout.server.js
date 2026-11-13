import { redirect } from "@sveltejs/kit";
import { DOCUMENTS_DENSITY_COOKIE, DOCUMENTS_DENSITY_DENSE } from "#lib/shared/documents-density.js";

export function load(event) {
    if (!event.locals.user) {
        throw redirect(302, "/login");
    }

    return { dense: event.cookies.get(DOCUMENTS_DENSITY_COOKIE) === DOCUMENTS_DENSITY_DENSE };
}
