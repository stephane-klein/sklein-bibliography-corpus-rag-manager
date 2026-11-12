-- Example schema — replace with your actual consolidated schema
-- The executable path is migrations + functions.sql; this file is a reference.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_search CASCADE;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- generate_nanoid(), immutable_unaccent() and immutable_authors_text() are
-- defined in sqls/functions.sql.

CREATE DOMAIN nanoid AS TEXT
    CONSTRAINT nanoid_format CHECK (VALUE ~ '^[0-9a-z]{10}$');

-- Flat content nodes imported from contents/. One row per Markdown file.
-- Hierarchy columns (parent_id, level) will be added with the books import.
-- markdown_source_file is relative to contents/; metadata stores the frontmatter.
CREATE TABLE hierarchical_content_nodes (
    id                                        SERIAL PRIMARY KEY,
    created_at                                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    nanoid                                    nanoid NOT NULL UNIQUE DEFAULT generate_nanoid(10),
    slug                                      TEXT NOT NULL UNIQUE,
    title                                     TEXT NOT NULL,
    content                                   TEXT NOT NULL,
    source_url                                TEXT,
    authors                                   TEXT[] NOT NULL DEFAULT '{}',
    original_published_date                   TEXT
        CHECK (original_published_date ~ '^[0-9]{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)?$'),
    markdown_source_file                      TEXT NOT NULL UNIQUE,
    markdown_source_file_hash                 TEXT NOT NULL,
    markdown_source_file_estimate_token_count INTEGER NOT NULL
        CHECK (markdown_source_file_estimate_token_count >= 0),
    metadata                                  JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_hierarchical_content_nodes_original_published_date
    ON hierarchical_content_nodes (original_published_date DESC NULLS LAST, id DESC);

-- PostgreSQL maintains this index transactionally on every INSERT, UPDATE and
-- DELETE. No application code is required in the sync endpoint.
CREATE INDEX idx_hierarchical_content_nodes_bm25
    ON hierarchical_content_nodes
    USING paradedb (
        id,
        (content::pdb.simple('stemmer=french', 'ascii_folding=true')),
        (authors::pdb.literal),
        (original_published_date::pdb.literal),
        created_at,
        updated_at
    );

-- Partial, accent-insensitive filters on the bibliographic metadata. The title
-- and author fields use ILIKE on the unaccented expressions; these GIN trigram
-- indexes accelerate the pattern match.
CREATE INDEX idx_hierarchical_content_nodes_title_unaccent_trgm
    ON hierarchical_content_nodes
    USING GIN (immutable_unaccent(title) gin_trgm_ops);

CREATE INDEX idx_hierarchical_content_nodes_authors_unaccent_trgm
    ON hierarchical_content_nodes
    USING GIN (immutable_unaccent(immutable_authors_text(authors)) gin_trgm_ops);

-- Chunk-level retrieval table. One row per sidecar chunk; the vector dimension
-- is fixed to 1024 for the Voyage 4 series.
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

-- Query embedding cache for semantic search. Only query vectors live here; the
-- document vectors are in content_chunks. The query text is not stored, only
-- its SHA-256 hash. No purge yet: last_used_at and hit_count feed a future
-- retention policy.
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

CREATE TABLE users (
    id              TEXT                     NOT NULL PRIMARY KEY,
    email           TEXT                     NOT NULL UNIQUE,
    display_name    TEXT                     NOT NULL,
    password_hash   TEXT,
    oidc_issuer     TEXT,
    oidc_subject    TEXT,
    locale          TEXT,
    is_active       BOOLEAN                  NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_oidc ON users (oidc_issuer, oidc_subject)
    WHERE oidc_issuer IS NOT NULL AND oidc_subject IS NOT NULL;

CREATE TABLE sessions (
    id          TEXT                     NOT NULL PRIMARY KEY,
    user_id     TEXT                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);

CREATE TABLE api_tokens (
    id          TEXT                     NOT NULL PRIMARY KEY,
    user_id     TEXT                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT                     NOT NULL,
    token_hash  TEXT                     NOT NULL UNIQUE,
    last_used   TIMESTAMP WITH TIME ZONE,
    expires_at  TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_tokens_user_id ON api_tokens (user_id);
CREATE UNIQUE INDEX idx_api_tokens_user_id_name ON api_tokens (user_id, name);

-- Audit log for MCP read-only tool calls. See 00016_mcp_access_log.sql and
-- 00017_mcp_access_log_tool_details.sql for the meaning of the embedding_*,
-- vectorize_*, result_* and tool_arguments columns.
CREATE TABLE mcp_access_log (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    tool_name            TEXT NOT NULL,
    session_id           TEXT,
    token_id             TEXT REFERENCES api_tokens(id) ON DELETE SET NULL,
    user_id              TEXT REFERENCES users(id) ON DELETE SET NULL,
    client_name          TEXT,
    client_version       TEXT,
    ip                   TEXT,

    query                TEXT NOT NULL,
    purpose              TEXT CHECK (purpose IS NULL OR char_length(purpose) <= 400),
    tool_arguments       JSONB NOT NULL DEFAULT '{}'::jsonb,
    success              BOOLEAN NOT NULL,
    error_stage          TEXT CHECK (error_stage IN ('validation', 'embedding', 'database')),

    duration_ms          INTEGER,
    embedding_ms         INTEGER,
    embedding_model      TEXT,
    vectorize_calls      INTEGER NOT NULL DEFAULT 0 CHECK (vectorize_calls >= 0),
    vectorize_cache_hits INTEGER NOT NULL DEFAULT 0 CHECK (vectorize_cache_hits >= 0),
    embedding_tokens     INTEGER NOT NULL DEFAULT 0 CHECK (embedding_tokens >= 0),
    embedding_cost_usd   NUMERIC(14, 8) NOT NULL DEFAULT 0 CHECK (embedding_cost_usd >= 0),

    input_chars          INTEGER,
    output_chars         INTEGER,
    result_count         INTEGER CHECK (result_count IS NULL OR result_count >= 0),
    result_total         INTEGER CHECK (result_total IS NULL OR result_total >= 0),
    result_meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
    truncated            BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_mcp_access_log_created_at
    ON mcp_access_log (created_at DESC);

CREATE INDEX idx_mcp_access_log_user_created_at
    ON mcp_access_log (user_id, created_at DESC);

CREATE TABLE password_reset_tokens (
    id         TEXT                     NOT NULL PRIMARY KEY,
    user_id    TEXT                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT                     NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used       BOOLEAN                  NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);

CREATE TABLE magic_link_tokens (
    id         TEXT                     NOT NULL PRIMARY KEY,
    user_id    TEXT                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT                     NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used       BOOLEAN                  NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_magic_link_tokens_user_id ON magic_link_tokens (user_id);

-- Anti-brute-force: records sign-in attempts (password + magic link) so the
-- server can throttle repeated failures per client IP and per email.
CREATE TABLE IF NOT EXISTS login_attempts (
    id           BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ip           TEXT         NOT NULL,
    email        TEXT         NOT NULL,
    action       TEXT         NOT NULL CHECK (action IN ('password', 'magic_link')),
    success      BOOLEAN      NOT NULL,
    attempted_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip
    ON login_attempts (ip, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email
    ON login_attempts (email, attempted_at DESC);
