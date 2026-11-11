-- Query embedding cache for semantic search.
--
-- Semantic search embeds the user query with the Voyage query model, then
-- compares the vector with content_chunks.embedding. This table keeps the
-- vector of a normalized query so a repeated search does not call the provider
-- again.
--
-- The query text is not stored, only its SHA-256 hash. The key also includes
-- the provider, the model and the dimension, so a provider or model change
-- never reuses an incompatible vector.
--
-- embedding_model holds the query model (voyage-4-lite), not the document
-- model used for content_chunks (voyage-4).
--
-- There is no purge yet. last_used_at and hit_count are updated on every cache
-- hit so a later migration can add a retention policy without altering the
-- table.

CREATE TABLE query_embedding_cache (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    hit_count            INTEGER NOT NULL DEFAULT 1 CHECK (hit_count >= 1),

    query_hash           TEXT NOT NULL CHECK (query_hash ~ '^sha256:[0-9a-f]{64}$'),
    embedding_provider   TEXT NOT NULL,
    embedding_model      TEXT NOT NULL,
    embedding_dimension  INTEGER NOT NULL CHECK (embedding_dimension > 0),
    embedding            vector NOT NULL,

    CONSTRAINT query_embedding_cache_key_unique UNIQUE (
        query_hash,
        embedding_provider,
        embedding_model,
        embedding_dimension
    ),
    CONSTRAINT query_embedding_cache_dimension_matches
        CHECK (vector_dims(embedding) = embedding_dimension)
);
