import { safeParse } from "valibot";
import { sql } from "#lib/server/pg.js";
import { problem } from "#lib/server/problem.js";
import { contentNodeSyncSchema } from "#lib/schemas/content-node.js";
import { requireAdminToken } from "../../_helpers.js";

const MAX_UPSERT_ITEMS = 500;
const MAX_PRUNE_KEEP_ITEMS = 5000;

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
    const parsed = safeParse(contentNodeSyncSchema, body);

    if (!parsed.success) {
        throw new SyncError(422, parsed.issues[0].message);
    }

    const { upsert = [], prune, dry_run = false } = parsed.output;

    if (upsert.length === 0 && !prune) {
        throw new SyncError(400, "upsert or prune must contain at least one item");
    }

    if (upsert.length > MAX_UPSERT_ITEMS) {
        throw new SyncError(422, `upsert must not exceed ${MAX_UPSERT_ITEMS} items`);
    }

    const seenPaths = new Set();
    const seenSlugs = new Set();

    for (const item of upsert) {
        if (seenPaths.has(item.markdown_source_file)) {
            throw new SyncError(422, `duplicate markdown_source_file in upsert: ${item.markdown_source_file}`);
        }
        seenPaths.add(item.markdown_source_file);

        if (seenSlugs.has(item.slug)) {
            throw new SyncError(422, `duplicate slug in upsert: ${item.slug}`);
        }
        seenSlugs.add(item.slug);
    }

    if (prune) {
        if (prune.keep.length === 0) {
            throw new SyncError(422, "prune.keep must contain at least one item");
        }

        if (prune.keep.length > MAX_PRUNE_KEEP_ITEMS) {
            throw new SyncError(422, `prune.keep must not exceed ${MAX_PRUNE_KEEP_ITEMS} items`);
        }

        const seenKeep = new Set();

        for (const path of prune.keep) {
            if (!path.startsWith(prune.scope)) {
                throw new SyncError(422, `prune.keep path must be under prune.scope: ${path}`);
            }

            if (seenKeep.has(path)) {
                throw new SyncError(422, `duplicate path in prune.keep: ${path}`);
            }
            seenKeep.add(path);
        }
    }

    return { upsert, prune, dryRun: dry_run };
}

async function sync(tx, { upsert, prune, dryRun }) {
    const paths = upsert.map((item) => item.markdown_source_file);
    const existingRows = paths.length
        ? await tx`
              SELECT nanoid, slug, markdown_source_file, markdown_source_file_hash
              FROM hierarchical_content_nodes
              WHERE markdown_source_file IN ${tx(paths)}
          `
        : [];
    const existingByPath = new Map(existingRows.map((row) => [row.markdown_source_file, row]));

    const items = [];
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const item of upsert) {
        const existing = existingByPath.get(item.markdown_source_file);

        if (!existing) {
            const [row] = await tx`
                INSERT INTO hierarchical_content_nodes (
                    slug,
                    title,
                    content,
                    source_url,
                    authors,
                    original_published_date,
                    markdown_source_file,
                    markdown_source_file_hash,
                    markdown_source_file_estimate_token_count,
                    metadata
                )
                VALUES (
                    ${item.slug},
                    ${item.title},
                    ${item.content},
                    ${item.source_url ?? null},
                    ${item.authors ?? []},
                    ${item.original_published_date ?? null},
                    ${item.markdown_source_file},
                    ${item.markdown_source_file_hash},
                    ${item.markdown_source_file_estimate_token_count},
                    ${JSON.stringify(item.metadata ?? {})}::jsonb
                )
                RETURNING nanoid, slug, markdown_source_file
            `;
            items.push({ ...row, action: "inserted" });
            inserted += 1;
        } else if (existing.markdown_source_file_hash !== item.markdown_source_file_hash) {
            const [row] = await tx`
                UPDATE hierarchical_content_nodes
                SET slug = ${item.slug},
                    title = ${item.title},
                    content = ${item.content},
                    source_url = ${item.source_url ?? null},
                    authors = ${item.authors ?? []},
                    original_published_date = ${item.original_published_date ?? null},
                    markdown_source_file_hash = ${item.markdown_source_file_hash},
                    markdown_source_file_estimate_token_count = ${item.markdown_source_file_estimate_token_count},
                    metadata = ${JSON.stringify(item.metadata ?? {})}::jsonb,
                    updated_at = now()
                WHERE markdown_source_file = ${item.markdown_source_file}
                RETURNING nanoid, slug, markdown_source_file
            `;
            items.push({ ...row, action: "updated" });
            updated += 1;
        } else {
            items.push({
                nanoid: existing.nanoid,
                slug: existing.slug,
                markdown_source_file: existing.markdown_source_file,
                action: "unchanged",
            });
            unchanged += 1;
        }
    }

    let deletedPaths = [];

    if (prune) {
        const scopedRows = await tx`
            SELECT markdown_source_file
            FROM hierarchical_content_nodes
            WHERE starts_with(markdown_source_file, ${prune.scope})
        `;
        const keepSet = new Set(prune.keep);

        deletedPaths = scopedRows.map((row) => row.markdown_source_file).filter((path) => !keepSet.has(path));

        if (deletedPaths.length > 0) {
            await tx`
                DELETE FROM hierarchical_content_nodes
                WHERE markdown_source_file IN ${tx(deletedPaths)}
            `;
        }
    }

    const result = {
        dry_run: dryRun,
        inserted,
        updated,
        unchanged,
        deleted: deletedPaths.length,
        items,
        deleted_paths: deletedPaths,
    };

    if (dryRun) {
        throw new DryRunRollback(result);
    }

    return result;
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
                self: { href: "/api/v1/admin/hierarchical-content-nodes/sync" },
            },
        });
    } catch (err) {
        if (err instanceof DryRunRollback) {
            return Response.json({
                data: err.result,
                _links: {
                    self: { href: "/api/v1/admin/hierarchical-content-nodes/sync" },
                },
            });
        }

        if (err instanceof SyncError) {
            return problem(err.status, err.detail, event.request.url);
        }

        if (err?.code === "23505") {
            return problem(409, "A content node with this slug or source file already exists", event.request.url);
        }

        throw err;
    }
}
