-- Adds a public nanoid identifier to contacts.
--
-- pgcrypto is installed in the application schema. The deployment model is one
-- dedicated database per application.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE DOMAIN nanoid AS TEXT
    CONSTRAINT nanoid_format CHECK (VALUE ~ '^[0-9a-z]{10}$');

-- Bootstrap copy: sqls/functions.sql is the source of truth and replaces this
-- definition with CREATE OR REPLACE on every migrate. The function must exist
-- before the column DEFAULT is installed.
CREATE OR REPLACE FUNCTION generate_nanoid(
    size INT DEFAULT 10,
    alphabet TEXT DEFAULT '0123456789abcdefghijklmnopqrstuvwxyz'
)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
    id_builder     TEXT := '';
    bytes          BYTEA;
    alphabet_index INT;
    mask           INT;
    step           INT;
BEGIN
    IF size IS NULL OR size < 1 THEN
        RAISE EXCEPTION 'size must be a positive integer';
    END IF;

    IF alphabet IS NULL OR LENGTH(alphabet) < 2 THEN
        RAISE EXCEPTION 'alphabet must contain at least two characters';
    END IF;

    mask := (2 << FLOOR(LOG(2, LENGTH(alphabet) - 1))::INT) - 1;
    step := CEIL(1.6 * mask * size / LENGTH(alphabet))::INT;

    WHILE TRUE LOOP
        bytes := gen_random_bytes(step);

        FOR i IN 0 .. step - 1 LOOP
            alphabet_index := GET_BYTE(bytes, i) & mask;

            IF alphabet_index < LENGTH(alphabet) THEN
                id_builder := id_builder || SUBSTR(alphabet, alphabet_index + 1, 1);

                IF LENGTH(id_builder) = size THEN
                    RETURN id_builder;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

ALTER TABLE contacts
    ADD COLUMN nanoid nanoid NOT NULL UNIQUE DEFAULT generate_nanoid(10);
