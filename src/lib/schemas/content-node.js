import {
    array,
    boolean,
    check,
    integer,
    minLength,
    minValue,
    nullable,
    number,
    object,
    optional,
    picklist,
    pipe,
    record,
    string,
    union,
    unknown,
} from "valibot";

export function relativeMarkdownPath() {
    return pipe(
        string(),
        minLength(1),
        check(
            (value) => !value.startsWith("/") && !value.split("/").includes("..") && value.endsWith(".md"),
            "must be a relative path ending with .md",
        ),
    );
}

const relativeScope = pipe(
    string(),
    minLength(1),
    check(
        (value) => value.endsWith("/") && !value.startsWith("/") && !value.split("/").includes(".."),
        "must be a relative directory path ending with /",
    ),
);

const relativeSlug = pipe(
    string(),
    minLength(1),
    check(
        (value) => !value.startsWith("/") && !value.endsWith("/") && !value.split("/").includes(".."),
        "must be a relative slug",
    ),
);

const httpUrl = pipe(
    string(),
    check((value) => {
        try {
            const url = new URL(value);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch {
            return false;
        }
    }, "must be an http(s) URL"),
);

const partialIsoDate = pipe(
    string(),
    check(
        (value) => /^[0-9]{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)?$/.test(value),
        "must be an ISO 8601 partial date: YYYY, YYYY-MM, or YYYY-MM-DD",
    ),
);

const sha256Hash = pipe(
    string(),
    check((value) => /^sha256:[0-9a-f]{64}$/.test(value), "must use the sha256:<64 hex> format"),
);

const sourceKind = picklist(["epub", "web", "video", "pdf"]);
const language = picklist(["fr", "en"]);

const contentNodeUpsertObject = object({
    slug: relativeSlug,
    parent_slug: optional(nullable(relativeSlug)),
    depth: optional(pipe(number(), integer(), minValue(0))),
    position: optional(pipe(number(), integer(), minValue(0))),
    title: pipe(string(), minLength(1)),
    content: string(),
    source_url: optional(nullable(httpUrl)),
    source_kind: optional(nullable(sourceKind)),
    language: optional(language),
    authors: optional(array(pipe(string(), minLength(1)))),
    original_published_date: optional(nullable(partialIsoDate)),
    markdown_source_file: optional(nullable(relativeMarkdownPath())),
    markdown_source_file_hash: optional(nullable(sha256Hash)),
    markdown_source_file_estimate_token_count: optional(pipe(number(), integer(), minValue(0))),
    metadata: optional(record(string(), unknown())),
});

// A structural node (work, part) has no Markdown file and no hash: its content
// is empty. A file-backed node has both. Keeping the rule here means the sync
// endpoint and the OpenAPI schema share the same validation.
export const contentNodeUpsertSchema = pipe(
    contentNodeUpsertObject,
    check((item) => {
        const hasFile = typeof item.markdown_source_file === "string" && item.markdown_source_file.length > 0;
        const hasHash = typeof item.markdown_source_file_hash === "string" && item.markdown_source_file_hash.length > 0;

        return hasFile ? item.content.length > 0 && hasHash : item.content === "" && !hasHash;
    }, "file-backed nodes need content and a hash; structural nodes need empty content and no hash"),
);

const contentNodePruneByPathSchema = object({
    scope: relativeScope,
    keep: array(relativeMarkdownPath()),
});

const contentNodePruneBySlugSchema = object({
    scope_slug: relativeSlug,
    keep_slugs: array(relativeSlug),
});

export const contentNodePruneSchema = union([contentNodePruneByPathSchema, contentNodePruneBySlugSchema]);

export const contentNodeSyncSchema = object({
    upsert: optional(array(contentNodeUpsertSchema)),
    prune: optional(contentNodePruneSchema),
    dry_run: optional(boolean()),
});
