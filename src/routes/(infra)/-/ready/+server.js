import { sql } from "#lib/server/pg.js";
import { isMailAvailable } from "#lib/server/mailer.js";

export async function GET() {
    try {
        await sql`SELECT 1`;
    } catch {
        return new Response(
            JSON.stringify({ status: "error", ready: false, checks: { database: "error", smtp: "unknown" } }),
            { status: 503 },
        );
    }

    return Response.json({
        status: "ok",
        ready: true,
        checks: { database: "ok", smtp: isMailAvailable() ? "ok" : "unconfigured" },
    });
}
