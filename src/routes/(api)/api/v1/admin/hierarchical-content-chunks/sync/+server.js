import { safeParse } from "valibot";
import { sql } from "#lib/server/pg.js";
import { problem } from "#lib/server/problem.js";
import { contentChunkSyncSchema } from "#lib/schemas/content-chunk.js";
import { requireAdminToken } from "../../_helpers.js";

const MAX_CHUNKS = 5000;

class SyncError extends Error {
    constructor(status, detail) {
        super(detail);
        this.status = status;
        this.detail = detail;
    }
}

class DryRunRollback extends Error {
    constructor(result) {
        super("dry run");
        this.result = result;
    }
}

function validateRequest(body) {
    const parsed = safeParse(contentChunkSyncSchema, body);

    if (!parsed.success) {
        throw new SyncError(422, parsed.issues[0].message);
    }

    const { chunks, chunk_count: chunkCount } = parsed.output;

    if (chunks.length !== chunkCount) {
        throw new SyncError(422, `chunk_count is ${chunkCount}, but chunks contains ${chunks.length} items`);
    }

    if (chunks.length > MAX_CHUNKS) {
        throw new SyncError(422, `chunks must not exceed ${MAX_CHUNKS} items`);
    }

    for (const [index, chunk] of chunks.entries()) {
        if (chunk.chunk_index !== index) {
            throw new SyncError(422, `chunk_index must be ${index}, got ${chunk.chunk_index}`);
        }
    }

    return { request: parsed.output };
}

async function sync(tx, { request }) {
    const [node] = await tx`
        SELECT id, markdown_source_file_hash
        FROM hierarchical_content_nodes
        WHERE markdown_source_file = ${request.source_file}
    `;

    if (!node) {
        throw new SyncError(422, `document is not imported: ${request.source_file}`);
    }

    if (node.markdown_source_file_hash !== request.source_file_hash) {
        throw new SyncError(
            409,
            "source_file_hash does not match the imported document; re-import the Markdown file first",
        );
    }

    const [existing] = await tx`
        SELECT count(*)::int AS count,
               min(markdown_source_file_hash) AS markdown_source_file_hash,
               min(embedding_provider) AS embedding_provider,
               min(embedding_model) AS embedding_model,
               min(embedding_strategy) AS embedding_strategy,
               min(embedding_input_format) AS embedding_input_format,
               min(embedding_input_type) AS embedding_input_type
        FROM content_chunks
        WHERE content_node_id = ${node.id}
    `;

    if (
        existing.count > 0 &&
        existing.count === request.chunk_count &&
        existing.markdown_source_file_hash === request.source_file_hash &&
        existing.embedding_provider === request.embedding_provider &&
        existing.embedding_model === request.embedding_model &&
        existing.embedding_strategy === request.embedding_strategy &&
        existing.embedding_input_format === request.embedding_input_format &&
        existing.embedding_input_type === request.embedding_input_type
    ) {
        const result = {
            source_file: request.source_file,
            deleted: 0,
            inserted: 0,
            chunks: existing.count,
            unchanged: true,
        };

        if (request.dry_run) {
            throw new DryRunRollback({ ...result, dry_run: true });
        }

        return { ...result, dry_run: false };
    }

    const deletedRows = await tx`
        DELETE FROM content_chunks
        WHERE content_node_id = ${node.id}
        RETURNING id
    `;
    const metadata = JSON.stringify({
        embedding_file: request.embedding_file,
        embedding_format: request.embedding_format,
    });

    for (const chunk of request.chunks) {
        await tx`
            INSERT INTO content_chunks (
                content_node_id,
                markdown_source_file,
                markdown_source_file_hash,
                chunk_index,
                heading_path,
                content,
                content_token_count,
                embedding_provider,
                embedding_model,
                embedding_dimension,
                embedding_strategy,
                embedding_input_format,
                embedding_input_type,
                embedding,
                metadata
            )
            VALUES (
                ${node.id},
                ${request.source_file},
                ${request.source_file_hash},
                ${chunk.chunk_index},
                ${chunk.heading_path},
                ${chunk.content},
                ${chunk.content_token_count},
                ${request.embedding_provider},
                ${request.embedding_model},
                ${request.embedding_dimension},
                ${request.embedding_strategy},
                ${request.embedding_input_format},
                ${request.embedding_input_type},
                ${JSON.stringify(chunk.embedding)}::vector,
                ${metadata}::jsonb
            )
        `;
    }

    const result = {
        source_file: request.source_file,
        deleted: deletedRows.length,
        inserted: request.chunks.length,
        chunks: request.chunks.length,
        unchanged: false,
    };

    if (request.dry_run) {
        throw new DryRunRollback({ ...result, dry_run: true });
    }

    return { ...result, dry_run: false };
}

export async function PUT(event) {
    const authError = requireAdminToken(event);
    if (authError) return authError;

    let body;

    try {
        body = await event.request.json();
    } catch {
        return problem(400, "Invalid JSON body", event.request.url);
    }

    let request;

    try {
        request = validateRequest(body);
    } catch (err) {
        if (err instanceof SyncError) {
            return problem(err.status, err.detail, event.request.url);
        }
        throw err;
    }

    try {
        const result = await sql.begin((tx) => sync(tx, request));

        return Response.json({
            data: result,
            _links: {
                self: { href: "/api/v1/admin/hierarchical-content-chunks/sync" },
            },
        });
    } catch (err) {
        if (err instanceof DryRunRollback) {
            return Response.json({
                data: err.result,
                _links: {
                    self: { href: "/api/v1/admin/hierarchical-content-chunks/sync" },
                },
            });
        }

        if (err instanceof SyncError) {
            return problem(err.status, err.detail, event.request.url);
        }

        throw err;
    }
}
