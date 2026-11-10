import postgres from "postgres";

import { logger } from "./logger.js";
import { sqlDuration } from "./metrics.js";
import { getMetrics } from "./pg-metrics.js";
import { onShutdown } from "./lifecycle.js";

const POSTGRES_URL = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_URL;
export const POSTGRES_SCHEMA = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_SCHEMA || "public";

const raw = postgres(POSTGRES_URL, {
    idle_timeout: 1,
    connection: {
        search_path: POSTGRES_SCHEMA,
    },
    onnotice: (notice) => logger.debug({ ...notice }, "PostgreSQL notice"),
});

const INSTRUMENTED = Symbol("instrumented");

function wrapQuery(query, sqlStr) {
    let startedAt = 0;
    let endTimer = null;
    let store = null;
    let recorded = false;

    function record() {
        if (recorded || endTimer === null) return;
        recorded = true;
        endTimer();
        endTimer = null;
        store?.queries.push({ durationMs: performance.now() - startedAt });
    }

    const originalHandle = query.handle;
    const originalResolve = query.resolve;
    const originalReject = query.reject;

    query.handle = function () {
        if (endTimer === null) {
            startedAt = performance.now();
            endTimer = sqlDuration.startTimer({ query: sqlStr });
            // Capture the request store here: resolve() may run in the
            // connection's async context, not the request's.
            store = getMetrics();
        }
        return originalHandle.apply(this, arguments);
    };

    query.resolve = function (value) {
        record();
        return originalResolve.call(this, value);
    };

    query.reject = function (error) {
        record();
        return originalReject.call(this, error);
    };

    return query;
}

function instrumentSql(instance) {
    if (instance[INSTRUMENTED]) return instance;
    instance[INSTRUMENTED] = true;

    return new Proxy(instance, {
        apply(target, thisArg, args) {
            const query = Reflect.apply(target, thisArg, args);
            const sqlStr = String(args[0]?.[0] ?? "").slice(0, 50);
            return wrapQuery(query, sqlStr);
        },
        get(target, prop, receiver) {
            if (prop === INSTRUMENTED) return true;

            const value = Reflect.get(target, prop, receiver);
            if (typeof value !== "function") return value;

            if (prop === "unsafe" || prop === "file") {
                return function (...args) {
                    const sqlStr = String(args[0] ?? "").slice(0, 50);
                    const query = value.apply(target, args);
                    return wrapQuery(query, sqlStr);
                };
            }

            if (prop === "begin") {
                return function (callback, ...rest) {
                    return value.call(
                        target,
                        (scopedSql, ...cbArgs) => callback(instrumentSql(scopedSql), ...cbArgs),
                        ...rest,
                    );
                };
            }

            if (prop === "reserve") {
                return async function (...args) {
                    const reserved = await value.apply(target, args);
                    reserved.sql = instrumentSql(reserved.sql);
                    return reserved;
                };
            }

            return value;
        },
    });
}

export const sql = instrumentSql(raw);

onShutdown(() => sql.end({ timeout: 5 }));

export async function waitForDb(maxRetries = 10, delayMs = 1000) {
    logger.info(`Attempting to connect to ${POSTGRES_URL.replace(/\/\/.*:/, "//xxxxx:")}`);

    for (let i = 1; i <= maxRetries; i++) {
        try {
            await sql`SELECT 1`;
            return;
        } catch (err) {
            if (i === maxRetries) throw err;
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
}
