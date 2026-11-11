import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { logger } from "#lib/server/logger.js";
import { createMcpReadonlyServer } from "#lib/server/mcp/mcp-readonly-tools.js";
import { sqlReadonly } from "#lib/server/mcp/mcp-readonly-db.js";

const sessions = new Map();
const SESSION_IDLE_TTL_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 200;

function pruneSessions(now = Date.now()) {
    for (const [id, entry] of sessions) {
        if (now - entry.lastActive > SESSION_IDLE_TTL_MS) {
            sessions.delete(id);
            logger.info({ sessionId: id }, "MCP read-only session expired");
        }
    }
}

function authorize(event) {
    const header = event.request.headers.get("Authorization");

    // MCP clients authenticate with an API token. A browser session cookie must
    // not be enough: the endpoint can run arbitrary SQL and must not be exposed
    // to a CSRF request from a logged-in browser.
    if (!header?.startsWith("Bearer ") || event.locals.authMethod !== "bearer") {
        return null;
    }

    return event.locals.user ?? null;
}

function jsonRpcError(status, message) {
    return new Response(
        JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32000, message },
            id: null,
        }),
        { status, headers: { "Content-Type": "application/json" } },
    );
}

async function createSession(context) {
    const server = await createMcpReadonlyServer({ context });
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
            context.sessionId = id;
            sessions.set(id, {
                server,
                transport,
                tokenId: context.tokenId,
                userId: context.userId,
                lastActive: Date.now(),
            });
            logger.info({ sessionId: id }, "MCP read-only session initialized");
        },
    });

    transport.onclose = () => {
        if (transport.sessionId) {
            sessions.delete(transport.sessionId);
            logger.info({ sessionId: transport.sessionId }, "MCP read-only session closed");
        }
    };

    await server.connect(transport);

    return { server, transport };
}

function clientAddress(event) {
    try {
        return event.getClientAddress();
    } catch {
        return null;
    }
}

async function handleMcp(event) {
    if (!sqlReadonly) {
        return jsonRpcError(503, "MCP read-only access disabled");
    }

    const { request } = event;
    const user = authorize(event);

    if (!user) {
        return jsonRpcError(401, event.locals.authFailure === "expired" ? "API token expired" : "Unauthorized");
    }

    const sessionId = request.headers.get("mcp-session-id");

    if (sessionId) {
        const entry = sessions.get(sessionId);

        if (
            !entry ||
            entry.tokenId !== event.locals.apiTokenId ||
            entry.userId !== user.id ||
            Date.now() - entry.lastActive > SESSION_IDLE_TTL_MS
        ) {
            if (entry) sessions.delete(sessionId);

            return jsonRpcError(404, "Session not found");
        }

        entry.lastActive = Date.now();
        return entry.transport.handleRequest(request);
    }

    pruneSessions();

    if (sessions.size >= MAX_SESSIONS) {
        return jsonRpcError(503, "Too many sessions");
    }

    let transport;

    try {
        const context = {
            tokenId: event.locals.apiTokenId ?? null,
            userId: user.id,
            ip: clientAddress(event),
            sessionId: null,
        };
        ({ transport } = await createSession(context));
    } catch (err) {
        logger.error({ err }, "Failed to create an MCP read-only session");
        return jsonRpcError(503, "MCP read-only access unavailable");
    }

    return transport.handleRequest(request);
}

export async function POST(event) {
    return handleMcp(event);
}

export async function GET(event) {
    return handleMcp(event);
}

export async function DELETE(event) {
    return handleMcp(event);
}
