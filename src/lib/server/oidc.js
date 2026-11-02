import { createHash, randomBytes } from "node:crypto";
import { logger } from "./logger.js";

const issuer = process.env.AUTHELIA_ISSUER;
const clientId = process.env.AUTHELIA_CLIENT_ID;
const clientSecret = process.env.AUTHELIA_CLIENT_SECRET;
const origin = process.env.MY_APP_ORIGIN || "http://localhost:5173";
const redirectURI = `${origin}/login/oidc/callback`;

let endpointsCache = null;

export const isAutheliaConfigured = Boolean(issuer && clientId && clientSecret);

export function logAutheliaConfig() {
    if (isAutheliaConfigured) {
        logger.info({ issuer }, "Authelia sign-in enabled");
        return;
    }

    if (!issuer) logger.warn("Authelia sign-in disabled — AUTHELIA_ISSUER is not set");
    if (!clientId) logger.warn("Authelia sign-in disabled — AUTHELIA_CLIENT_ID is not set");
    if (!clientSecret) logger.warn("Authelia sign-in disabled — AUTHELIA_CLIENT_SECRET is not set");
}

function assertConfigured() {
    if (!isAutheliaConfigured) {
        throw new Error("AUTHELIA_ISSUER, AUTHELIA_CLIENT_ID and AUTHELIA_CLIENT_SECRET must be set");
    }
}

function generateState() {
    return randomBytes(32).toString("base64url");
}

function generateCodeVerifier() {
    return randomBytes(32).toString("base64url");
}

function createS256CodeChallenge(codeVerifier) {
    return createHash("sha256").update(codeVerifier).digest("base64url");
}

function createAuthorizationURLWithPKCE(authorizationEndpoint, state, codeVerifier, scopes) {
    const url = new URL(authorizationEndpoint);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectURI);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", createS256CodeChallenge(codeVerifier));
    if (scopes.length > 0) {
        url.searchParams.set("scope", scopes.join(" "));
    }
    return url;
}

async function discoverEndpoints() {
    if (endpointsCache) return endpointsCache;

    const discoveryUrl = `${issuer}/.well-known/openid-configuration`;

    let res;
    try {
        res = await fetch(discoveryUrl);
    } catch (err) {
        logger.error({ err, discoveryUrl }, "OIDC discovery fetch failed");
        throw new Error(`Failed to fetch OpenID configuration: ${err.message}`, { cause: err });
    }

    if (!res.ok) {
        logger.error(
            { discoveryUrl, status: res.status, statusText: res.statusText },
            "OIDC discovery returned non-OK status",
        );
        throw new Error(`Failed to fetch OpenID configuration: ${res.status}`);
    }

    let config;
    try {
        config = await res.json();
    } catch (err) {
        logger.error({ err, discoveryUrl }, "OIDC discovery response was not valid JSON");
        throw new Error("Failed to parse OpenID configuration", { cause: err });
    }

    endpointsCache = {
        authorizationEndpoint: config.authorization_endpoint,
        tokenEndpoint: config.token_endpoint,
        userinfoEndpoint: config.userinfo_endpoint,
    };

    logger.info(
        {
            authorizationEndpoint: config.authorization_endpoint,
            tokenEndpoint: config.token_endpoint,
            userinfoEndpoint: config.userinfo_endpoint,
            issuer: config.issuer,
        },
        "OIDC endpoints discovered",
    );

    return endpointsCache;
}

export async function createAuthorizationURL() {
    assertConfigured();
    const { authorizationEndpoint } = await discoverEndpoints();
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = createAuthorizationURLWithPKCE(authorizationEndpoint, state, codeVerifier, [
        "openid",
        "profile",
        "email",
    ]);

    logger.info({ url: url.toString() }, "OIDC authorization URL created");

    return { url, state, codeVerifier };
}

export async function validateAuthorizationCode(code, codeVerifier) {
    assertConfigured();
    const { tokenEndpoint } = await discoverEndpoints();

    const body = new URLSearchParams();
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", redirectURI);
    body.set("code_verifier", codeVerifier);

    const basicCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    let res;
    try {
        res = await fetch(tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                Authorization: `Basic ${basicCredentials}`,
            },
            body,
        });
    } catch (err) {
        logger.error({ err, tokenEndpoint }, "OIDC token request failed");
        throw err;
    }

    if (!res.ok) {
        logger.error(
            { tokenEndpoint, status: res.status, statusText: res.statusText },
            "OIDC token endpoint returned non-OK status",
        );
        throw new Error(`OIDC token request failed: ${res.status}`);
    }

    let tokens;
    try {
        tokens = await res.json();
    } catch (err) {
        logger.error({ err, tokenEndpoint }, "OIDC token response was not valid JSON");
        throw new Error("Failed to parse OIDC token response", { cause: err });
    }

    logger.info("OIDC authorization code validated");

    return tokens;
}

export async function getUserInfoEndpoint() {
    const { userinfoEndpoint } = await discoverEndpoints();
    return userinfoEndpoint;
}

export function extractClaims(idToken) {
    const payload = idToken.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    return JSON.parse(Buffer.from(base64, "base64").toString());
}
