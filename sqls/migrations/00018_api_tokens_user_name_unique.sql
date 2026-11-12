-- The admin users sync identifies a token by (user_id, name), so a declarative
-- payload can create or update a token idempotently. Fail before creating the
-- index when existing rows collide: silently deleting or renaming a token would
-- revoke access without warning.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM api_tokens
        GROUP BY user_id, name
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot add unique index idx_api_tokens_user_id_name: duplicate (user_id, name) rows exist in api_tokens; rename or delete the duplicates first';
    END IF;
END $$;

CREATE UNIQUE INDEX idx_api_tokens_user_id_name ON api_tokens (user_id, name);
