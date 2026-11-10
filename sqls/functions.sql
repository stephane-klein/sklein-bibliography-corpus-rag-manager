-- Stored functions, reloaded on every `pnpm migrate`.
--
-- This file MUST stay idempotent. Prefer `CREATE OR REPLACE FUNCTION`. Use
-- `DROP FUNCTION IF EXISTS` only when the signature changes: a function
-- referenced by a column `DEFAULT` cannot be dropped while the default depends
-- on it.
--
-- A migration that drops or renames a table used by a function here must ship
-- the matching update of this file, otherwise the next `pnpm migrate` fails
-- loudly here.
--
-- `DROP FUNCTION IF EXISTS` statements emit "does not exist, skipping" NOTICEs,
-- which the pino `onnotice` hook logs at debug. Wrap them in
-- `SET LOCAL client_min_messages = warning` ... `= notice` when they would emit
-- NOTICEs. `CREATE OR REPLACE` does not emit that NOTICE.
--
-- The template below is an example. `generate_nanoid` is defined at the end of
-- this file.
--
-- SET LOCAL client_min_messages = warning;
--
-- DROP FUNCTION IF EXISTS contacts_count();
--
-- SET LOCAL client_min_messages = notice;
--
-- CREATE FUNCTION contacts_count() RETURNS bigint
-- LANGUAGE sql
-- AS $$
--     SELECT count(*) FROM contacts;
-- $$;
--
-- COMMENT ON FUNCTION contacts_count() IS 'Example function — returns the number of rows in contacts.';

-- IMMUTABLE wrapper around unaccent() for the trigram GIN indexes on
-- hierarchical_content_nodes (title, authors). PostgreSQL only accepts
-- IMMUTABLE expressions in an index, and unaccent() is STABLE. The search query
-- also calls it so both sides of the comparison are normalised the same way.
CREATE OR REPLACE FUNCTION immutable_unaccent(input_text TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
SET search_path FROM CURRENT
RETURN unaccent(input_text);

-- array_to_string() is STABLE, and PostgreSQL rejects an index expression that
-- calls any non-IMMUTABLE function. This wrapper joins authors with spaces for
-- the trigram index on hierarchical_content_nodes.
CREATE OR REPLACE FUNCTION immutable_authors_text(authors TEXT[]) RETURNS TEXT
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
RETURN array_to_string(authors, ' ');

-- `contacts.nanoid` uses this function as a DEFAULT, so do not DROP it.
-- `CREATE OR REPLACE` keeps the dependency intact.
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

COMMENT ON FUNCTION generate_nanoid(INT, TEXT)
    IS 'Generates a nanoid from cryptographically secure random bytes.';
