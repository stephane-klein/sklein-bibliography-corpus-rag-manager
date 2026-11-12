-- Book import: a node can now be a whole work, a part without its own
-- Markdown file, or a section backed by a Markdown file.
--
-- parent_id is a self-reference. depth is the position in the document tree
-- (0 = work, 1 = part or front matter, 2 = chapter, ...), while level is kept
-- for the future summary abstraction levels. position orders siblings.
--
-- Structural nodes (work, part) have no Markdown file: markdown_source_file,
-- markdown_source_file_hash and content are empty. File-backed nodes keep
-- their Markdown body and hash.
--
-- language drives content_fr/content_en, two generated columns used by the
-- single ParadeDB index. pg_search 0.26 allows only one ParadeDB index per
-- table, but each indexed field can have its own stemmer. content remains the
-- single source of truth for the application.
ALTER TABLE hierarchical_content_nodes
    ADD COLUMN parent_id INTEGER
        REFERENCES hierarchical_content_nodes(id) ON DELETE CASCADE,
    ADD COLUMN depth INTEGER NOT NULL DEFAULT 0 CHECK (depth >= 0),
    ADD COLUMN position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    ADD COLUMN source_kind TEXT
        CHECK (source_kind IS NULL OR source_kind IN ('epub', 'web', 'video', 'pdf')),
    ADD COLUMN language TEXT NOT NULL DEFAULT 'fr'
        CHECK (language IN ('fr', 'en')),
    ADD COLUMN content_fr TEXT
        GENERATED ALWAYS AS (CASE WHEN language = 'fr' THEN content END) STORED,
    ADD COLUMN content_en TEXT
        GENERATED ALWAYS AS (CASE WHEN language = 'en' THEN content END) STORED;

ALTER TABLE hierarchical_content_nodes
    ALTER COLUMN content SET DEFAULT '',
    ALTER COLUMN markdown_source_file DROP NOT NULL,
    ALTER COLUMN markdown_source_file_hash DROP NOT NULL;

ALTER TABLE hierarchical_content_nodes
    ADD CONSTRAINT hierarchical_content_nodes_file_consistency CHECK (
        (markdown_source_file IS NULL AND markdown_source_file_hash IS NULL)
        OR
        (markdown_source_file IS NOT NULL AND markdown_source_file_hash IS NOT NULL)
    ),
    ADD CONSTRAINT hierarchical_content_nodes_container_empty_content CHECK (
        markdown_source_file IS NOT NULL OR content = ''
    );

CREATE INDEX idx_hierarchical_content_nodes_parent_position
    ON hierarchical_content_nodes (parent_id, position);

DROP INDEX IF EXISTS idx_hierarchical_content_nodes_bm25;

CREATE INDEX idx_hierarchical_content_nodes_bm25
    ON hierarchical_content_nodes
    USING paradedb (
        id,
        (content_fr::pdb.simple('stemmer=french', 'ascii_folding=true')),
        (content_en::pdb.simple('stemmer=english', 'ascii_folding=true')),
        (authors::pdb.literal),
        (original_published_date::pdb.literal),
        created_at,
        updated_at
    );

-- The content-node sync endpoint used to run JSON.stringify() before casting
-- the parameter to jsonb. The postgres client serialized the string again, so
-- existing rows stored metadata as a JSON string instead of a JSON object, and
-- metadata->'key' returned NULL. Unwrap those values. This repairs data written
-- before this migration; new writes pass the object directly.
UPDATE hierarchical_content_nodes
SET metadata = (metadata #>> '{}')::jsonb
WHERE jsonb_typeof(metadata) = 'string'
  AND (metadata #>> '{}') ~ '^[[:space:]]*[\{\[]';
