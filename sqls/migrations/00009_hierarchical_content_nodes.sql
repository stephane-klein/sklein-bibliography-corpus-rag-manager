-- Flat content nodes for the development corpus.
-- This first iteration imports one row per Markdown file from
-- contents/single-document-texts/. Hierarchy columns will come with books.
--
-- markdown_source_file is relative to main/contents/.
-- markdown_source_file_hash uses the "sha256:<hex>" format.
-- metadata stores the Markdown frontmatter as JSON.
CREATE TABLE hierarchical_content_nodes (
    id                                        SERIAL PRIMARY KEY,
    created_at                                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                                TIMESTAMPTZ NOT NULL DEFAULT now(),
    nanoid                                    nanoid NOT NULL UNIQUE DEFAULT generate_nanoid(10),
    slug                                      TEXT NOT NULL UNIQUE,
    title                                     TEXT NOT NULL,
    content                                   TEXT NOT NULL,
    source_url                                TEXT,
    markdown_source_file                      TEXT NOT NULL UNIQUE,
    markdown_source_file_hash                 TEXT NOT NULL,
    markdown_source_file_estimate_token_count INTEGER NOT NULL
        CHECK (markdown_source_file_estimate_token_count >= 0),
    metadata                                  JSONB NOT NULL DEFAULT '{}'::jsonb
);
