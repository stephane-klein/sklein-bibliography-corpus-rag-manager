-- Bibliographic metadata read from the Markdown frontmatter.
--
-- authors: author display names, ordered as they appear in the source.
-- original_published_date: ISO 8601 partial date. TEXT preserves the original
-- precision: "1776", "1776-03" or "1776-03-09" are all valid.
ALTER TABLE hierarchical_content_nodes
    ADD COLUMN authors TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN original_published_date TEXT
        CHECK (original_published_date ~ '^[0-9]{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)?$');

CREATE INDEX idx_hierarchical_content_nodes_original_published_date
    ON hierarchical_content_nodes (original_published_date DESC NULLS LAST, id DESC);

COMMENT ON COLUMN hierarchical_content_nodes.authors IS 'Author display names from the Markdown frontmatter';
COMMENT ON COLUMN hierarchical_content_nodes.original_published_date IS 'ISO 8601 partial date: YYYY, YYYY-MM, or YYYY-MM-DD';
