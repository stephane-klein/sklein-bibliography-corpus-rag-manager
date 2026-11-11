import { getEmbeddingInfo } from "#lib/server/embedding.js";
import { MAX_VECTORIZE_TEXTS, MAX_VECTORIZE_TEXT_CHARS } from "#lib/server/mcp/config.js";
import { getReadOnlyTablesSchema } from "#lib/server/mcp/mcp-readonly-db.js";
import { getMcpReaderRole } from "#lib/server/mcp/mcp-reader-role.js";

export async function load({ url }) {
    let schema = null;

    try {
        schema = await getReadOnlyTablesSchema();
    } catch {
        // The page stays readable when the reader role or the database is
        // missing; the endpoint itself returns 503 in that case.
    }

    let embeddingModel = null;

    try {
        embeddingModel = getEmbeddingInfo().model;
    } catch {
        // The embedding provider is optional for the documentation page.
    }

    return {
        origin: url.origin,
        schema,
        readerRole: getMcpReaderRole(),
        embeddingModel,
        maxTexts: MAX_VECTORIZE_TEXTS,
        maxChars: MAX_VECTORIZE_TEXT_CHARS,
    };
}
