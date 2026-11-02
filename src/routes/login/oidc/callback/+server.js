import { redirect } from "@sveltejs/kit";
import { createSession, setSessionCookie } from "#lib/server/auth.js";
import { sql } from "#lib/server/pg.js";
import { validateAuthorizationCode, getUserInfoEndpoint } from "#lib/server/oidc.js";
import { logger } from "#lib/server/logger.js";

export async function GET({ url: reqUrl, cookies }) {
    const code = reqUrl.searchParams.get("code");
    const stateParam = reqUrl.searchParams.get("state");
    const errorParam = reqUrl.searchParams.get("error");

    if (errorParam) {
        logger.warn({ error: errorParam }, "OIDC provider returned error");
        throw redirect(302, "/login?error=oidc_error");
    }

    if (!code || !stateParam) {
        logger.warn({ hasCode: !!code, hasState: !!stateParam }, "Missing code or state in OIDC callback");
        throw redirect(302, "/login?error=invalid_request");
    }

    const storedState = cookies.get("oidc_state");
    const storedCodeVerifier = cookies.get("oidc_code_verifier");

    cookies.delete("oidc_state", { path: "/" });
    cookies.delete("oidc_code_verifier", { path: "/" });

    if (!storedState || !storedCodeVerifier || stateParam !== storedState) {
        logger.warn({ stateParam, storedState }, "OIDC state mismatch");
        throw redirect(302, "/login?error=invalid_state");
    }

    logger.info("OIDC callback received, validating authorization code");

    const issuer = (process.env.AUTHELIA_ISSUER || "").replace(/\/$/, "");
    let tokens;

    try {
        tokens = await validateAuthorizationCode(code, storedCodeVerifier);
    } catch (err) {
        logger.error({ err }, "OIDC authorization code validation failed");
        throw redirect(302, "/login?error=token_exchange_failed");
    }

    const accessToken = tokens.access_token;

    logger.info("OIDC authorization code validated, fetching userinfo");

    const userinfoEndpoint = await getUserInfoEndpoint();

    let res;
    try {
        res = await fetch(userinfoEndpoint, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    } catch (err) {
        logger.error({ err, userinfoEndpoint }, "Userinfo fetch failed");
        throw redirect(302, "/login?error=userinfo_failed");
    }

    if (!res.ok) {
        logger.error({ userinfoEndpoint, status: res.status }, "Userinfo returned non-OK status");
        throw redirect(302, "/login?error=userinfo_failed");
    }

    let userinfo;
    try {
        userinfo = await res.json();
    } catch (err) {
        logger.error({ err }, "Failed to parse userinfo response");
        throw redirect(302, "/login?error=userinfo_failed");
    }

    logger.info({ email: userinfo.email }, "Userinfo fetched");

    const [user] = await sql`
        SELECT id, email, display_name, locale, is_active FROM users
        WHERE email = ${userinfo.email} AND oidc_issuer = ${issuer}
    `;

    if (!user) {
        logger.warn({ email: userinfo.email, issuer }, "No local account found for OIDC user");
        throw redirect(302, "/login?error=no_account");
    }

    if (!user.is_active) {
        logger.warn({ email: userinfo.email, issuer }, "Local account is deactivated");
        throw redirect(302, "/login?error=account_inactive");
    }

    logger.info({ userId: user.id }, "OIDC user matched to local account, creating session");

    const session = await createSession(user.id);

    setSessionCookie(cookies, session.id);

    if (user.locale) {
        cookies.set("locale", user.locale, { path: "/", maxAge: 34560000, sameSite: "lax", httpOnly: false });
    }

    logger.info({ userId: user.id }, "Session created, redirecting to dashboard");

    throw redirect(302, "/dashboard");
}
