import client from "@prometheus-io/client";

export const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const sqlDuration = new client.Histogram({
    name: "sql_query_duration_seconds",
    help: "SQL query duration",
    labelNames: ["query"],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
    registers: [register],
});

export const renderDuration = new client.Histogram({
    name: "sveltekit_render_duration_seconds",
    help: "SSR render duration",
    labelNames: ["route"],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [register],
});
