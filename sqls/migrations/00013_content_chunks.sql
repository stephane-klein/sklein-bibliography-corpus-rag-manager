-- Chunk-level retrieval table for the corpus.
--
-- hierarchical_content_nodes stays the bibliographic catalog: one row per
-- Markdown file. content_chunks holds the paragraphs sent to the embedding
-- provider, one row per sidecar chunk.
--
-- markdown_source_file is relative to main/contents/ and matches
-- hierarchical_content_nodes.markdown_source_file.
-- markdown_source_file_hash uses the "sha256:<hex>" format.
-- embedding is NULL for chunks that are only searchable with BM25.
--
-- The vector dimension is fixed to 1024 for the Voyage 4 series. Changing the
-- embedding model to a different dimension requires a new migration and a full
-- reindex.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE content_chunks (
    id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    content_node_id           INTEGER NOT NULL
        REFERENCES hierarchical_content_nodes(id) ON DELETE CASCADE,
    markdown_source_file      TEXT NOT NULL,
    markdown_source_file_hash TEXT NOT NULL
        CHECK (markdown_source_file_hash ~ '^sha256:[0-9a-f]{64}$'),

    chunk_index               INTEGER NOT NULL CHECK (chunk_index >= 0),
    heading_path              TEXT NOT NULL,
    content                   TEXT NOT NULL,
    content_token_count       INTEGER NOT NULL CHECK (content_token_count >= 0),

    embedding_provider        TEXT,
    embedding_model           TEXT,
    embedding_dimension       INTEGER,
    embedding_strategy        TEXT NOT NULL DEFAULT 'standard',
    embedding_input_format    TEXT NOT NULL DEFAULT 'heading_path_text_v1',
    embedding_input_type      TEXT NOT NULL DEFAULT 'document',
    embedding                 vector(1024),

    metadata                  JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT content_chunks_node_chunk_unique
        UNIQUE (content_node_id, chunk_index),

    CONSTRAINT content_chunks_embedding_consistent CHECK (
        (embedding IS NULL
            AND embedding_provider IS NULL
            AND embedding_model IS NULL
            AND embedding_dimension IS NULL)
        OR
        (embedding IS NOT NULL
            AND embedding_provider IS NOT NULL
            AND embedding_model IS NOT NULL
            AND embedding_dimension = 1024)
    )
);

CREATE INDEX idx_content_chunks_markdown_source_file
    ON content_chunks (markdown_source_file);

CREATE INDEX idx_content_chunks_embedding_model
    ON content_chunks (embedding_model);

CREATE INDEX idx_content_chunks_embedding_hnsw
    ON content_chunks
    USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL;

CREATE INDEX idx_content_chunks_bm25
    ON content_chunks
    USING paradedb (
        id,
        (content::pdb.simple('stemmer=french', 'ascii_folding=true')),
        (markdown_source_file::pdb.literal),
        (embedding_model::pdb.literal)
    );
