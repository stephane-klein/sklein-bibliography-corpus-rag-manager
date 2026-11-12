-- Distinguish the MCP transport session from the agent conversation.
--
-- session_id (renamed to transport_session_id) is the Mcp-Session-Id UUID
-- created by WebStandardStreamableHTTPServerTransport. One transport
-- connection can serve several agent conversations.
--
-- client_session_id is the conversation ID that the MCP client sends in
-- tools/call params._meta. OpenCode sends its own session ID under the
-- "ai.opencode/sessionID" key, for example "ses_...". The value is stable
-- across the turns of one conversation, so it groups calls by conversation,
-- not by turn. It is absent for clients that do not send this metadata.
--
-- Both columns are nullable: existing rows keep NULL, and a client that does
-- not provide the metadata still records a row.
ALTER TABLE mcp_access_log
    RENAME COLUMN session_id TO transport_session_id;

ALTER TABLE mcp_access_log
    ADD COLUMN client_session_id TEXT
        CHECK (client_session_id IS NULL OR char_length(client_session_id) <= 255);

COMMENT ON COLUMN mcp_access_log.transport_session_id IS
    'MCP transport session (Mcp-Session-Id); one connection can serve several agent conversations';

COMMENT ON COLUMN mcp_access_log.client_session_id IS
    'Agent conversation ID from tools/call _meta (OpenCode: ai.opencode/sessionID); stable across turns, not a turn ID';
