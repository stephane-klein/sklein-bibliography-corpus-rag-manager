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

    const seenSlugs = new Set();
    const seenPaths = new Set();

    for (const item of upsert) {
        if (seenSlugs.has(item.slug)) {
            throw new SyncError(422, `duplicate slug in upsert: ${item.slug}`);
        }
        seenSlugs.add(item.slug);

        if (item.markdown_source_file) {
            if (seenPaths.has(item.markdown_source_file)) {
                throw new SyncError(422, `duplicate markdown_source_file in upsert: ${item.markdown_source_file}`);
            }
            seenPaths.add(item.markdown_source_file);
        }

        const parentSlug = item.parent_slug ?? null;
        const depth = item.depth ?? 0;

        if (parentSlug === item.slug) {
            throw new SyncError(422, `node cannot be its own parent: ${item.slug}`);
        }

        if (parentSlug === null && depth !== 0) {
            throw new SyncError(422, `root node must have depth 0: ${item.slug}`);
        }

        if (parentSlug !== null && depth < 1) {
            throw new SyncError(422, `child node must have depth >= 1: ${item.slug}`);
        }
    }

    let pruneMode = null;

    if (prune) {
        if ("scope_slug" in prune) {
            pruneMode = "slug";

            if (prune.keep_slugs.length === 0) {
                throw new SyncError(422, "prune.keep_slugs must contain at least one item");
            }

            if (prune.keep_slugs.length > MAX_PRUNE_KEEP_ITEMS) {
                throw new SyncError(422, `prune.keep_slugs must not exceed ${MAX_PRUNE_KEEP_ITEMS} items`);
            }

            const seenKeep = new Set();

            for (const slug of prune.keep_slugs) {
                if (slug !== prune.scope_slug && !slug.startsWith(`${prune.scope_slug}/`)) {
                    throw new SyncError(422, `prune.keep_slugs item must be under prune.scope_slug: ${slug}`);
                }

                if (seenKeep.has(slug)) {
                    throw new SyncError(422, `duplicate slug in prune.keep_slugs: ${slug}`);
                }
                seenKeep.add(slug);
            }
        } else {
            pruneMode = "path";

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
    }

    return { upsert, prune, pruneMode, dryRun: dry_run };
}

function normalizeItem(item) {
    return {
        slug: item.slug,
        parent_slug: item.parent_slug ?? null,
        depth: item.depth ?? 0,
        position: item.position ?? 0,
        title: item.title,
        content: item.content,
        source_url: item.source_url ?? null,
        source_kind: item.source_kind ?? null,
        language: item.language ?? "fr",
        authors: item.authors ?? [],
        original_published_date: item.original_published_date ?? null,
        markdown_source_file: item.markdown_source_file ?? null,
        markdown_source_file_hash: item.markdown_source_file_hash ?? null,
        markdown_source_file_estimate_token_count: item.markdown_source_file_estimate_token_count ?? 0,
        metadata: item.metadata ?? {},
    };
}

async function sync(tx, { upsert, prune, pruneMode, dryRun }) {
    const normalized = upsert.map((item) => normalizeItem(item));
    const payloadBySlug = new Map(normalized.map((item) => [item.slug, item]));
    const lookupSlugs = [
        ...new Set([
            ...normalized.map((item) => item.slug),
            ...normalized.map((item) => item.parent_slug).filter((slug) => typeof slug === "string" && slug.length > 0),
        ]),
    ];
    const existingRows = lookupSlugs.length
        ? await tx`
              SELECT id, nanoid, slug, parent_id, depth, position, title, content, source_url,
                     source_kind, language, authors, original_published_date,
                     markdown_source_file, markdown_source_file_hash,
                     markdown_source_file_estimate_token_count, metadata
              FROM hierarchical_content_nodes
              WHERE slug IN ${tx(lookupSlugs)}
          `
        : [];
    const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
    const idBySlug = new Map(existingRows.map((row) => [row.slug, row.id]));

    for (const item of normalized) {
        if (item.parent_slug === null) {
            continue;
        }

        const parent = payloadBySlug.get(item.parent_slug) ?? existingBySlug.get(item.parent_slug);

        if (!parent) {
            throw new SyncError(422, `parent_slug not found: ${item.parent_slug}`);
        }

        const parentDepth = parent.depth ?? 0;

        if (item.depth !== parentDepth + 1) {
            throw new SyncError(
                422,
                `depth mismatch for ${item.slug}: parent ${item.parent_slug} has depth ${parentDepth}, expected ${parentDepth + 1}`,
            );
        }
    }

    const payloadOrder = new Map(normalized.map((item, index) => [item.slug, index]));
    const ordered = [...normalized].sort(
        (left, right) => left.depth - right.depth || payloadOrder.get(left.slug) - payloadOrder.get(right.slug),
    );

    const items = [];
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const item of ordered) {
        const existing = existingBySlug.get(item.slug);
        const parentId = item.parent_slug === null ? null : idBySlug.get(item.parent_slug);

        if (item.parent_slug !== null && parentId === undefined) {
            throw new SyncError(422, `parent was not processed before child: ${item.parent_slug}`);
        }

        if (!existing) {
            const [row] = await tx`
                INSERT INTO hierarchical_content_nodes (
                    slug,
                    parent_id,
                    depth,
                    position,
                    title,
                    content,
                    source_url,
                    source_kind,
                    language,
                    authors,
                    original_published_date,
                    markdown_source_file,
                    markdown_source_file_hash,
                    markdown_source_file_estimate_token_count,
                    metadata
                )
                VALUES (
                    ${item.slug},
                    ${parentId},
                    ${item.depth},
                    ${item.position},
                    ${item.title},
                    ${item.content},
                    ${item.source_url},
                    ${item.source_kind},
                    ${item.language},
                    ${item.authors},
                    ${item.original_published_date},
                    ${item.markdown_source_file},
                    ${item.markdown_source_file_hash},
                    ${item.markdown_source_file_estimate_token_count},
                    ${item.metadata}::jsonb
                )
                RETURNING id, nanoid, slug, markdown_source_file
            `;
            idBySlug.set(row.slug, row.id);
            items.push({ ...row, action: "inserted" });
            inserted += 1;
            continue;
        }

        if (sameNode(existing, item, parentId)) {
            items.push({
                nanoid: existing.nanoid,
                slug: existing.slug,
                markdown_source_file: existing.markdown_source_file,
                action: "unchanged",
            });
            unchanged += 1;
            continue;
        }

        const [row] = await tx`
            UPDATE hierarchical_content_nodes
            SET parent_id = ${parentId},
                depth = ${item.depth},
                position = ${item.position},
                title = ${item.title},
                content = ${item.content},
                source_url = ${item.source_url},
                source_kind = ${item.source_kind},
                language = ${item.language},
                authors = ${item.authors},
                original_published_date = ${item.original_published_date},
                markdown_source_file = ${item.markdown_source_file},
                markdown_source_file_hash = ${item.markdown_source_file_hash},
                markdown_source_file_estimate_token_count = ${item.markdown_source_file_estimate_token_count},
                metadata = ${item.metadata}::jsonb,
                updated_at = now()
            WHERE slug = ${item.slug}
            RETURNING id, nanoid, slug, markdown_source_file
        `;
        idBySlug.set(row.slug, row.id);
        items.push({ ...row, action: "updated" });
        updated += 1;
    }

    let deletedRows = [];

    if (prune) {
        const scopedRows =
            pruneMode === "slug"
                ? await tx`
                      SELECT slug, markdown_source_file
                      FROM hierarchical_content_nodes
                      WHERE slug = ${prune.scope_slug}
                         OR starts_with(slug, ${`${prune.scope_slug}/`})
                  `
                : await tx`
                      SELECT slug, markdown_source_file
                      FROM hierarchical_content_nodes
                      WHERE starts_with(markdown_source_file, ${prune.scope})
                  `;
        const keepSet = new Set(pruneMode === "slug" ? prune.keep_slugs : prune.keep);

        deletedRows = scopedRows.filter((row) =>
            pruneMode === "slug" ? !keepSet.has(row.slug) : !keepSet.has(row.markdown_source_file),
        );

        if (deletedRows.length > 0) {
            // Deleting a parent cascades to its descendants. The book importer
            // keeps the whole tree, so a kept child never sits under a deleted
            // parent in practice.
            await tx`
                DELETE FROM hierarchical_content_nodes
                WHERE slug IN ${tx(deletedRows.map((row) => row.slug))}
            `;
        }
    }

    const result = {
        dry_run: dryRun,
        inserted,
        updated,
        unchanged,
        deleted: deletedRows.length,
        items,
        deleted_paths: deletedRows.map((row) => row.markdown_source_file).filter((path) => path !== null),
        deleted_slugs: deletedRows.map((row) => row.slug),
    };

    if (dryRun) {
        throw new DryRunRollback(result);
    }

    return result;
}

function sameNode(existing, item, parentId) {
    return (
        existing.parent_id === parentId &&
        existing.depth === item.depth &&
        existing.position === item.position &&
        existing.title === item.title &&
        existing.content === item.content &&
        existing.source_url === item.source_url &&
        existing.source_kind === item.source_kind &&
        existing.language === item.language &&
        arraysEqual(existing.authors, item.authors) &&
        existing.original_published_date === item.original_published_date &&
        existing.markdown_source_file === item.markdown_source_file &&
        existing.markdown_source_file_hash === item.markdown_source_file_hash &&
        existing.markdown_source_file_estimate_token_count === item.markdown_source_file_estimate_token_count &&
        stableStringify(existing.metadata) === stableStringify(item.metadata)
    );
}

function arraysEqual(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function stableStringify(value) {
    if (value === undefined) {
        return "undefined";
    }

    if (value === null || typeof value !== "object") {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
    }

    return `{${Object.keys(value)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
        .join(",")}}`;
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
