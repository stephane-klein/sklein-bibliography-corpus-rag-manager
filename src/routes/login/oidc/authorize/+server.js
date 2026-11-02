import { redirect } from "@sveltejs/kit";
import { createAuthorizationURL } from "#lib/server/oidc.js";
import { logger } from "#lib/server/logger.js";

export async function GET({ cookies }) {
    let result;

    try {
        result = await createAuthorizationURL();
    } catch (err) {
        logger.error({ err }, "Failed to create OIDC authorization URL");
        throw redirect(302, "/login?error=oidc_init_failed");
    }

    const { url, state, codeVerifier } = result;

    cookies.set("oidc_state", state, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 10,
    });

    cookies.set("oidc_code_verifier", codeVerifier, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 10,
    });

    logger.info({ redirectUrl: url.toString() }, "Redirecting to OIDC provider");

    throw redirect(302, url.toString(), { external: true });
}
