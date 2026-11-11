import {
    array,
    boolean,
    check,
    integer,
    minLength,
    minValue,
    number,
    object,
    optional,
    picklist,
    pipe,
    string,
} from "valibot";
import { relativeMarkdownPath } from "#lib/schemas/content-node.js";

const embeddingVector = pipe(
    array(number()),
    check((values) => values.length === 1024, "must contain 1024 dimensions"),
    check((values) => values.every((value) => Number.isFinite(value)), "must contain finite numbers"),
);

const chunkSchema = object({
    chunk_index: pipe(number(), integer(), minValue(0)),
    heading_path: pipe(string(), minLength(1)),
    content: pipe(string(), minLength(1)),
    content_token_count: pipe(number(), integer(), minValue(0)),
    embedding: embeddingVector,
});

export const contentChunkSyncSchema = object({
    source_file: relativeMarkdownPath(),
    source_file_hash: pipe(
        string(),
        check((value) => /^sha256:[0-9a-f]{64}$/.test(value), "must use the sha256:<64 hex> format"),
    ),
    embedding_provider: pipe(string(), minLength(1)),
    embedding_model: pipe(string(), minLength(1)),
    embedding_dimension: pipe(
        number(),
        integer(),
        check((value) => value === 1024, "must be 1024"),
    ),
    embedding_strategy: picklist(["standard", "contextualized"]),
    embedding_input_format: pipe(string(), minLength(1)),
    embedding_input_type: picklist(["document"]),
    embedding_file: pipe(string(), minLength(1)),
    embedding_format: pipe(string(), minLength(1)),
    chunk_count: pipe(number(), integer(), minValue(0)),
    chunks: array(chunkSchema),
    dry_run: optional(boolean()),
});
