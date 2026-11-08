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
    pipe,
    record,
    string,
    unknown,
} from "valibot";

function relativeMarkdownPath() {
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

export const contentNodeUpsertSchema = object({
    slug: relativeSlug,
    title: pipe(string(), minLength(1)),
    content: pipe(string(), minLength(1)),
    source_url: optional(nullable(httpUrl)),
    authors: optional(array(pipe(string(), minLength(1)))),
    original_published_date: optional(nullable(partialIsoDate)),
    markdown_source_file: relativeMarkdownPath(),
    markdown_source_file_hash: pipe(
        string(),
        check((value) => /^sha256:[0-9a-f]{64}$/.test(value), "must use the sha256:<64 hex> format"),
    ),
    markdown_source_file_estimate_token_count: pipe(number(), integer(), minValue(0)),
    metadata: optional(record(string(), unknown())),
});

export const contentNodePruneSchema = object({
    scope: relativeScope,
    keep: array(relativeMarkdownPath()),
});

export const contentNodeSyncSchema = object({
    upsert: optional(array(contentNodeUpsertSchema)),
    prune: optional(contentNodePruneSchema),
    dry_run: optional(boolean()),
});
