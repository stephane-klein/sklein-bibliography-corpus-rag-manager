import { createHash } from "node:crypto";
import { sql } from "#lib/server/pg.js";

// The cache only stores query vectors, so the key never carries an input type.
// Building the key from the normalized text keeps `Paris` and `  Paris ` on the
// same entry while preserving the case, which can change the meaning.
export function buildQueryEmbeddingKey(query, info) {
    const normalized = query.normalize("NFC").replaceAll("\u0000", "").replace(/\s+/gu, " ").trim();

    return {
        query_hash: `sha256:${createHash("sha256").update(normalized).digest("hex")}`,
        embedding_provider: info.provider,
        embedding_model: info.query_model,
        embedding_dimension: info.dimension,
    };
}

// `postgres.js` does not know the `vector` type, so the column comes back as
// text like "[0.1,0.2,...]". JSON.parse turns it into a number array.
export async function readQueryEmbedding(key) {
    const [row] = await sql`
        UPDATE query_embedding_cache
           SET last_used_at = now(),
               hit_count = hit_count + 1
         WHERE query_hash = ${key.query_hash}
           AND embedding_provider = ${key.embedding_provider}
           AND embedding_model = ${key.embedding_model}
           AND embedding_dimension = ${key.embedding_dimension}
        RETURNING embedding::text AS embedding
    `;

    return row ? JSON.parse(row.embedding) : null;
}

// A concurrent search may insert the same key between the miss and this write.
// DO NOTHING keeps the existing row, and the caller still uses its own vector.
export async function writeQueryEmbedding(key, embedding) {
    await sql`
        INSERT INTO query_embedding_cache (
            query_hash,
            embedding_provider,
            embedding_model,
            embedding_dimension,
            embedding
        )
        VALUES (
            ${key.query_hash},
            ${key.embedding_provider},
            ${key.embedding_model},
            ${key.embedding_dimension},
            ${JSON.stringify(embedding)}::vector
        )
        ON CONFLICT ON CONSTRAINT query_embedding_cache_key_unique DO NOTHING
    `;
}
