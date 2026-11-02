import { email, pipe, safeParse, string } from "valibot";
import { problem } from "#lib/server/problem.js";
import { sendMail } from "#lib/server/mailer.js";
import { logger } from "#lib/server/logger.js";
import { requireAdminToken } from "../_helpers.js";

const TEST_EMAIL_TO = process.env.TEST_EMAIL_TO;
const SUBJECT = "Test email from Sklein Bibliography Corpus RAG Manager";
const TEXT = "This is a test email sent from Sklein Bibliography Corpus RAG Manager.";

export async function POST(event) {
    const authError = requireAdminToken(event);
    if (authError) return authError;

    const body = await event.request.json().catch(() => ({}));
    const to = body.to || TEST_EMAIL_TO;

    if (!safeParse(pipe(string(), email()), to).success) {
        return problem(
            400,
            "A valid 'to' email address is required — set TEST_EMAIL_TO env or provide 'to' in the request body",
            event.request.url,
        );
    }

    try {
        const info = await sendMail({ to, subject: SUBJECT, text: TEXT });
        logger.info({ messageId: info.messageId, to, subject: SUBJECT }, "Test email sent");
        return Response.json({
            data: { messageId: info.messageId, to, subject: SUBJECT },
            _links: { self: { href: "/api/v1/admin/send-test-mail" } },
        });
    } catch (err) {
        logger.error({ err, to }, "Failed to send test email");
        return problem(500, `Failed to send email: ${err.message}`, event.request.url);
    }
}
