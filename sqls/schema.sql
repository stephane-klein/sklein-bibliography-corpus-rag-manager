-- Example schema — replace with your actual consolidated schema
CREATE TABLE contacts (
    id         BIGINT                   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    firstname  TEXT                     NOT NULL,
    lastname   TEXT                     NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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
