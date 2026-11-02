import { sequence } from "@sveltejs/kit/hooks";
import { dev } from "$app/env";
import { getTextDirection, serverAsyncLocalStorage } from "#lib/paraglide/runtime.js";
import { paraglideMiddleware } from "#lib/paraglide/server.js";
import { SESSION_COOKIE_NAME, setSessionCookie, validateApiToken, validateSession } from "#lib/server/auth.js";
import { sql } from "#lib/server/pg.js";
import { logger } from "#lib/server/logger.js";
import { renderDuration } from "#lib/server/metrics.js";
import { runWithMetrics as runWithPgMetrics, summarize as summarizePgMetrics } from "#lib/server/pg-metrics.js";
import { installShutdown } from "#lib/server/lifecycle.js";
import { logAutheliaConfig } from "#lib/server/oidc.js";
import { verifySmtpConnection } from "#lib/server/mailer.js";

export const init = () => {
    installShutdown({ dev });
    logAutheliaConfig();
    verifySmtpConnection();
};

const LOCALE_COOKIE = "locale";
const COOKIE_OPTS = { path: "/", maxAge: 34560000, sameSite: "lax", httpOnly: false };

async function authHandle({ event, resolve }) {
    event.locals.user = null;

    const sessionId = event.cookies.get(SESSION_COOKIE_NAME);

    if (sessionId) {
        const session = await validateSession(sessionId);

        if (session) {
            if (session.renewed) {
                setSessionCookie(event.cookies, session.id);
            }

            const [user] = await sql`SELECT id, email, display_name, locale FROM users WHERE id = ${session.user_id}`;

            if (user) {
                event.locals.user = user;
            }
        } else {
            event.cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
        }
    }

    if (!event.locals.user) {
        const authHeader = event.request.headers.get("Authorization");

        if (authHeader?.startsWith("Bearer ")) {
            const raw = authHeader.slice(7);
            const token = await validateApiToken(raw);

            if (token?.expired) {
                event.locals.authFailure = "expired";
            } else if (token) {
                const [user] = await sql`SELECT id, email, display_name, locale FROM users WHERE id = ${token.user_id}`;

                if (user) {
                    event.locals.user = user;
                }
            }
        }
    }

    let effectiveLocale = event.cookies.get(LOCALE_COOKIE);

    if (!effectiveLocale && event.locals.user?.locale) {
        effectiveLocale = event.locals.user.locale;
    }

    if (effectiveLocale) {
        event.locals.effectiveLocale = effectiveLocale;
        event.cookies.set(LOCALE_COOKIE, effectiveLocale, COOKIE_OPTS);
    }

    const route = event.route.id;

    if (route?.includes("(infra)")) {
        return resolve(event);
    }

    const end = renderDuration.startTimer({ route: route ?? "unknown" });
    const response = await resolve(event);

    end();

    return response;
}

const paraglideHandle = ({ event, resolve }) =>
    paraglideMiddleware(event.request, ({ request, locale }) => {
        event.request = request;

        const effectiveLocale = event.locals.effectiveLocale || locale;
        const outerStore = serverAsyncLocalStorage.getStore();

        return serverAsyncLocalStorage.run({ ...outerStore, locale: effectiveLocale }, () =>
            resolve(event, {
                transformPageChunk: ({ html }) =>
                    html
                        .replace("%paraglide.lang%", effectiveLocale)
                        .replace("%paraglide.dir%", getTextDirection(effectiveLocale)),
            }),
        );
    });

async function metricsHandle({ event, resolve }) {
    return runWithPgMetrics(async () => {
        const t0 = performance.now();

        const response = await resolve(event);

        const t1 = performance.now();
        const metrics = summarizePgMetrics();

        if (metrics) {
            // Server-Timing header is the transmission channel to TechInfoPopup
            // (not the idiomatic SvelteKit +page.server.js loader approach,
            // because these metrics belong to the request lifecycle itself,
            // not to any specific route)
            const phase = event.isDataRequest ? "csr" : "ssr";

            response.headers.set(
                "Server-Timing",
                [
                    `${phase}-pgcount;dur=${metrics.sqlQueryCount}`,
                    `${phase}-pgtime;dur=${metrics.totalQueryMs.toFixed(1)}`,
                    `${phase}-processing;dur=${(t1 - t0).toFixed(1)}`,
                ].join(", "),
            );
        }
        return response;
    });
}

/** @type {import('@sveltejs/kit/hooks').Handle} */
async function requestHandler({ event, resolve }) {
    const response = await resolve(event);

    // Prevent the one-time magic-login token (carried in the callback URL) from
    // leaking to third-party sites via the Referer header of subsequent requests.
    response.headers.set("Referrer-Policy", "no-referrer");

    return response;
}

export const handle = sequence(requestHandler, metricsHandle, authHandle, paraglideHandle);

export function handleError({ kind, error, event }) {
    const status = kind === "framework" ? error.status : undefined;

    if (!dev && status && status < 500) {
        return { message: status === 404 ? "Not Found" : "Client Error" };
    }

    if (dev && status === 404) {
        logger.warn({ url: event.url.toString() }, "Not found");
        return { message: "Not Found" };
    }

    logger.error({ error, url: event.url.toString() }, "Unhandled error");
    return { message: "Internal Error" };
}
