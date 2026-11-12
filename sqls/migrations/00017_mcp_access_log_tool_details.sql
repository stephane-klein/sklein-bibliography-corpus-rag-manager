-- Tool arguments and result counts for the MCP access log.
--
-- tool_arguments holds the arguments specific to the tool, without query and
-- purpose (already stored in their own columns). For semanticSearch it records
-- authors, title, limit, page and maxCharacters; for readOnlySqlQuery it
-- records maxCharacters. Vectors are never stored.
--
-- result_count is the number of rows or documents returned. result_total is the
-- number of matches before paging for semanticSearch, and the same value as
-- result_count for readOnlySqlQuery. result_meta holds hybrid, semantic_error,
-- semantic_source and total_pages.
--
-- Existing rows keep the defaults: an empty object and NULL counts.
ALTER TABLE mcp_access_log
    ADD COLUMN tool_arguments JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN result_count   INTEGER CHECK (result_count IS NULL OR result_count >= 0),
    ADD COLUMN result_total   INTEGER CHECK (result_total IS NULL OR result_total >= 0),
    ADD COLUMN result_meta    JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN mcp_access_log.tool_arguments IS
    'Tool-specific arguments, excluding query and purpose; never contains vectors';
COMMENT ON COLUMN mcp_access_log.result_count IS
    'Rows or documents returned by the tool';
COMMENT ON COLUMN mcp_access_log.result_total IS
    'Total matches before paging; equals result_count for SQL queries';
COMMENT ON COLUMN mcp_access_log.result_meta IS
    'Tool-specific result metadata: hybrid, semantic_error, semantic_source, total_pages';
