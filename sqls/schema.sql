-- Example schema — replace with your actual consolidated schema
-- The executable path is migrations + functions.sql; this file is a reference.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_search CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- generate_nanoid(), immutable_unaccent() and immutable_authors_text() are
-- defined in sqls/functions.sql.

CREATE DOMAIN nanoid AS TEXT
    CONSTRAINT nanoid_format CHECK (VALUE ~ '^[0-9a-z]{10}$');

CREATE TABLE contacts (
    id         BIGINT                   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nanoid     nanoid                   NOT NULL UNIQUE DEFAULT generate_nanoid(10),
    firstname  TEXT                     NOT NULL,
    lastname   TEXT                     NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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
