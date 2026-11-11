import { safeParse } from "valibot";
import { embedTexts, getEmbeddingInfo } from "#lib/server/embedding.js";
import { logger } from "#lib/server/logger.js";
import { problem } from "#lib/server/problem.js";
import { embeddingRequestSchema } from "#lib/schemas/embedding.js";
import { requireAdminToken } from "../_helpers.js";

export async function GET(event) {
    const authError = requireAdminToken(event);
    if (authError) return authError;

    try {
        return Response.json({
            data: getEmbeddingInfo(),
            _links: { self: { href: "/api/v1/admin/embeddings" } },
        });
    } catch (error) {
        logger.error({ err: error }, "Embedding provider is not configured");

        return problem(500, error.message, event.request.url);
    }
}

export async function POST(event) {
    const authError = requireAdminToken(event);
    if (authError) return authError;

    let body;

    try {
        body = await event.request.json();
    } catch {
        return problem(400, "Invalid JSON body", event.request.url);
    }

    const parsed = safeParse(embeddingRequestSchema, body);

    if (!parsed.success) {
        return problem(422, parsed.issues[0].message, event.request.url);
    }

    let info;

    try {
        info = getEmbeddingInfo();
    } catch (error) {
        logger.error({ err: error }, "Embedding provider is not configured");

        return problem(500, error.message, event.request.url);
    }

    const inputType = parsed.output.input_type ?? "document";
    const startedAt = performance.now();

    try {
        const result = await embedTexts(parsed.output.texts, { inputType });
        const durationMs = Math.round(performance.now() - startedAt);

        logger.info(
            {
                provider: result.provider,
                model: result.model,
                input_type: inputType,
                texts: parsed.output.texts.length,
                tokens: result.usage.tokens,
                cost_usd: result.usage.cost_usd,
                cost_basis: result.usage.cost_basis,
                duration_ms: durationMs,
            },
            "Embeddings generated",
        );

        return Response.json({
            data: {
                provider: result.provider,
                model: result.model,
                query_model: result.query_model,
                dimension: result.dimension,
                embeddings: result.embeddings,
                usage: result.usage,
            },
            _links: { self: { href: "/api/v1/admin/embeddings" } },
        });
    } catch (error) {
        logger.error(
            { err: error, provider: info.provider, input_type: inputType, texts: parsed.output.texts.length },
            "Embedding generation failed",
        );

        return problem(502, "Embedding provider request failed", event.request.url);
    }
}
