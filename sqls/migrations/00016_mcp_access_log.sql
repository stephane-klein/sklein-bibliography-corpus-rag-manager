-- Audit log for MCP read-only tool calls.
--
-- One row per tools/call request. The row keeps the SQL as the client wrote it
-- (with vectorize('...') placeholders), never the rewritten SQL with the
-- vector literals: a 1024-dimension vector is large, and it carries no useful
-- information for the audit trail.
--
-- embedding_* columns describe the vectorize() work done before execution.
-- vectorize_calls counts distinct texts sent to the embedding provider;
-- vectorize_cache_hits counts distinct texts served by query_embedding_cache.
-- Both are zero for a query without vectorize() calls.
--
-- token_id and user_id are nullable so the log survives token or user deletion.
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
    truncated            BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_mcp_access_log_created_at
    ON mcp_access_log (created_at DESC);

CREATE INDEX idx_mcp_access_log_user_created_at
    ON mcp_access_log (user_id, created_at DESC);
