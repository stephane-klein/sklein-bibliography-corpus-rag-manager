-- Adds accent-tolerant and typo-tolerant search on the bibliographic metadata
-- (title, authors) with pg_trgm. BM25 answers "which documents talk about X";
-- these indexes answer "which document is called X", on the short fields where
-- stemming and tokenisation do not help.
--
-- unaccent() is STABLE, so it cannot appear in an index expression. The
-- IMMUTABLE wrapper is also defined in sqls/functions.sql, which `pnpm migrate`
-- reloads after the migrations; the definition here is what a fresh database
-- needs before the indexes are created.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION immutable_unaccent(input_text text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
SET search_path FROM CURRENT
RETURN unaccent(input_text);

-- array_to_string() is STABLE, so it cannot appear in an index expression
-- either. This wrapper joins the authors with spaces, which is the form the
-- search query compares against.
CREATE OR REPLACE FUNCTION immutable_authors_text(authors text[]) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
RETURN array_to_string(authors, ' ');

CREATE INDEX IF NOT EXISTS idx_hierarchical_content_nodes_title_unaccent_trgm
    ON hierarchical_content_nodes
    USING GIN (immutable_unaccent(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_hierarchical_content_nodes_authors_unaccent_trgm
    ON hierarchical_content_nodes
    USING GIN (immutable_unaccent(immutable_authors_text(authors)) gin_trgm_ops);
