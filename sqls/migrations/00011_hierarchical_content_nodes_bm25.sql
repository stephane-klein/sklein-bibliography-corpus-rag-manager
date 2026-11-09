-- Adds BM25 search on hierarchical_content_nodes.content via ParadeDB pg_search.
--
-- PostgreSQL maintains this index transactionally on every INSERT, UPDATE and
-- DELETE. No application code is required in the sync endpoint.
--
-- Only one ParadeDB index is allowed per table. Text columns used for exact
-- filtering are indexed with pdb.literal so filters can be pushed down into
-- the index scan. Changing the tokenizer or the indexed columns requires a new
-- migration and a full rebuild of the index.
--
-- `paradedb` is the current access method name; `bm25` remains an alias.

CREATE EXTENSION IF NOT EXISTS pg_search CASCADE;

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
