// Graceful shutdown registry: runs teardown callbacks registered via onShutdown() on process exit.
// State is kept under a process-global key on globalThis (survives HMR); dev owns SIGINT/SIGTERM, prod listens to sveltekit:shutdown.
import { logger } from "./logger.js";

const TEARDOWN_TIMEOUT_MS = 5000;

function getState() {
    return (globalThis["graceful-shutdown.lifecycle"] ??= { callbacks: [], installed: false });
}

export function onShutdown(callback) {
    getState().callbacks.push(callback);
}

function withTimeout(callback) {
    let timer;
    return Promise.race([
        Promise.resolve().then(callback),
        new Promise((_, reject) => {
            timer = setTimeout(
                () => reject(new Error(`Shutdown callback timed out after ${TEARDOWN_TIMEOUT_MS}ms`)),
                TEARDOWN_TIMEOUT_MS,
            );
        }),
    ]).finally(() => clearTimeout(timer));
}

export async function runTeardowns(reason) {
    logger.info({ reason }, "Shutting down");

    const results = await Promise.allSettled(getState().callbacks.map((callback) => withTimeout(callback)));

    results.forEach((result, index) => {
        if (result.status === "rejected") {
            logger.warn({ reason, index, err: result.reason }, "Shutdown callback failed");
        }
    });

    logger.flush?.();
}

export function installShutdown({ dev }) {
    const state = getState();
    if (state.installed) return;
    state.installed = true;

    onShutdown(() => logger.flush?.());

    // Production: adapter-node closes the HTTP server (draining in-flight
    // requests) then emits this event. We must not force an exit here.
    process.on("sveltekit:shutdown", (reason) => {
        void runTeardowns(reason);
    });

    // Development: Vite neither exposes an application teardown hook nor
    // handles SIGINT, so we own the signal handling and the exit.
    if (dev) {
        ["SIGINT", "SIGTERM"].forEach((signal) => {
            process.prependListener(signal, async () => {
                await runTeardowns(signal);
                process.exit(0);
            });
        });
    }
}
