# MCP read-only server

The application exposes an MCP endpoint at `/mcp/readonly/`. It lets an MCP
client search the bibliography corpus by meaning and run one read-only SQL
statement against it. The tools are declared in
[`src/lib/server/mcp/mcp-readonly-tools.js`](../../src/lib/server/mcp/mcp-readonly-tools.js).

## Authentication and routing

- The public documentation page is `/mcp/`
  (`src/routes/(mcp)/mcp/+page.svelte`). It shows the endpoint, the reader role,
  the tool, the `vectorize()` contract, the live schema and client examples.
- The endpoint lives in the `(mcp)` route group, outside the `(private)` layout
  guard. It does not redirect to `/login`.
- `hooks.server.js` authenticates the `Authorization: Bearer <token>` header with
  the existing `api_tokens` table and sets `locals.authMethod = "bearer"` plus
  `locals.apiTokenId`.
- The MCP route refuses a session cookie: `locals.authMethod` must be `bearer`.
  This avoids exposing an arbitrary-SQL endpoint to a CSRF request from a
  logged-in browser.
- The application uses `trailingSlash = "always"`. The endpoint URL is
  `/mcp/readonly/`.

## Sessions

`src/routes/(mcp)/mcp/readonly/+server.js` keeps a process-local `Map` of MCP
sessions: 30-minute idle TTL, 200 sessions maximum. A session is bound to the
token ID and user ID that created it. The transport is
`WebStandardStreamableHTTPServerTransport`.

This session ID is the transport session (`Mcp-Session-Id`). One transport
connection can serve several agent conversations, so it does not identify a
conversation. The access log stores it in `transport_session_id`.

The agent conversation is a different value. For every `tools/call`, OpenCode
sends its own session ID in `params._meta["ai.opencode/sessionID"]` (for example
`ses_...`). The server stores it in `client_session_id`. The value stays the
same across the turns of one conversation, so it groups calls by conversation,
not by turn. Other clients may omit it.

The session map is not shared between replicas. Keep `app.replicaCount` at 1
unless a shared store or sticky sessions are added.

## Database access

The MCP server never uses the application database role for user SQL. It builds
a separate connection from the application URL with the reader role and
password:

- `SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_READONLY_POSTGRES_ROLE`
  (default `sklein_bibliography_mcp_reader`)
- `SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_READONLY_POSTGRES_PASSWORD`

`ensureMcpReaderRole()` runs from `src/migrate.js`. It creates the role when the
application role has `CREATEROLE` (the Helm chart sets `appRoleSuperuser: true`),
grants `USAGE` on the application schema, `SELECT` on
`hierarchical_content_nodes` and `content_chunks`, and `EXECUTE` on the
`IMMUTABLE` helpers and the ParadeDB functions. It also sets
`default_transaction_read_only`, `statement_timeout = 10s` and
`idle_in_transaction_session_timeout = 10s`.

The reader client repeats the same settings on every connection. Every query
also runs inside `BEGIN READ ONLY` with local timeouts. These are three
independent guards: role privileges, session defaults and transaction mode.

If the password is absent, `sqlReadonly` is `null`, the endpoint returns 503,
and non-MCP routes keep working.

## The `semanticSearch` tool

`semanticSearch` is a thin wrapper around `searchDocuments()` in
`src/lib/server/document-search.js`, the same function the `/documents/` page
uses. It runs BM25 over `hierarchical_content_nodes`, vector search over
`content_chunks`, fuses both rankings with Reciprocal Rank Fusion, and returns
the best matching passage per document.

The node BM25 index has two language fields: `content_fr` (French stemmer) and
`content_en` (English stemmer). `semanticSearch` queries both by default. When
writing a `readOnlySqlQuery` BM25 query, use
`(content_fr @@@ pdb.parse(...) OR content_en @@@ pdb.parse(...))` on nodes;
`content_chunks` still has a single `content` field.

The tool accepts:

- `query` (required): natural language question or keywords.
- `authors`: optional string or string array; every word must match.
- `title`: optional title words; every word must match.
- `page`: default 1.
- `limit`: default 10, maximum 20.
- `purpose` (required): recorded in `mcp_access_log`.

Each result carries `content_node_id`, `nanoid`, `title`, `authors`,
`original_published_date`, `source_url`, `chunk_index`, `heading_path`,
`excerpt`, `distance`, `bm25_rank`, `vector_rank` and `rrf`. The agent can use
`content_node_id` and `chunk_index` with `readOnlySqlQuery` to read the full
chunk.

`searchDocuments()` gained an optional `pageSize` parameter. The default remains
15, so the web UI keeps its pagination. `groupVectorRows()` now keeps
`chunk_index`, and `bm25Search()` selects `id`, so BM25-only results also carry
an identifier.

`semanticSearch` runs fixed SQL through the application database role. It does
not accept SQL from the client. `readOnlySqlQuery` remains the only arbitrary
SQL path and keeps using the reader role.

If the embedding provider is unavailable, `searchDocuments()` falls back to
BM25 and the tool returns `semantic_error` in its payload. The call still
succeeds and is logged as successful.

## The `vectorize()` rewrite

The tool accepts a virtual `vectorize('...')` call. The rewrite lives in
`src/lib/server/mcp/vectorize-sql.js` and uses `pgsql-parser` / `pgsql-deparser`
(the real PostgreSQL 18 parser, MIT).

Pipeline:

1. `parse(sql)` validates the statement and finds every `FuncCall` named
   `vectorize`.
2. The argument must be one `A_Const` string literal. Column references,
   expressions, `OVER`, `FILTER` and schema-qualified calls are rejected.
3. The distinct texts are embedded through `getQueryEmbeddings()`.
4. Each `FuncCall` node is replaced by a `TypeCast` around an `A_Const` holding
   `[0.1,...]`. The node template is parsed once from
   `SELECT '[0]'::vector`.
5. `deparse(ast)` rebuilds the SQL. The original text is not preserved: comments
   are dropped and formatting is normalized. That is fine because the SQL is
   executed immediately.
6. The rewritten SQL is parsed again and checked for a remaining `vectorize`
   call.
7. The statement is executed through the read-only client.

The AST replacement avoids byte offsets. `libpg-query` reports byte offsets, not
JavaScript string indices, so a textual replacement would break on accented text
before a call. The deparse route sidesteps that entirely.

Limits (environment variables in `mcp-readonly-tools.js`):

- max 8 distinct texts per query
- max 2000 characters per text
- max 100 000 characters per query
- large-read warning threshold: `SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_LARGE_RESULT_ROWS`
  (default 50)
- no `SELECT INTO`, `FOR UPDATE`/`FOR SHARE`, DDL, `DO`, `COPY` or multiple
  statements

## Embeddings and cost

`src/lib/server/mcp/query-embeddings.js` reads `query_embedding_cache`, embeds
the misses in one `embedTexts(..., { inputType: "query" })` call, and writes the
new vectors back. `vectorize` always uses the query model (`voyage-4-lite` by
default), not the document model stored in `content_chunks.embedding_model`.

The result carries `calls`, `cacheHits`, `tokens`, `costUsd` and `ms`. These
values go to `mcp_access_log`.

## Semantic search diagnostics

`semanticSearch` returns `filters`, `semantic_diagnostics` and `next_step`.
`semantic_error` has four values:

- `no-vectors`: no chunk is vectorized for the current document model and
  strategy.
- `filtered-out`: vectorized chunks exist, but the `authors` or `title` filters
  remove all of them.
- `no-matches`: no filter is active, but the query matches no vector.
- `unavailable`: the embedding provider or cache failed; the result is BM25 only.

When the result is empty, `next_step` says which case applies and suggests
listing authors or removing a filter. When the result is not empty, `next_step`
tells the agent to read only the returned `content_node_id` and `chunk_index`
passages.

`semantic_diagnostics` carries the counts used by that message:
`corpus_vectors`, `filtered_vectors`, `selection_total` and `corpus_total`.

## Access log

`mcp_access_log` is created by `sqls/migrations/00016_mcp_access_log.sql` and
extended by `00017_mcp_access_log_tool_details.sql` and
`00019_mcp_access_log_client_session.sql`. `recordMcpAccess()` inserts one row
per tool call in a `finally` block, so a query that fails after embedding still
records the embedding cost.

`transport_session_id` holds the MCP transport session UUID, the
`Mcp-Session-Id` value. `client_session_id` holds the conversation ID that the
client sent in the `tools/call` metadata, when it sends one. OpenCode fills it
with its `ai.opencode/sessionID` value. It is an opaque correlation value, never
an authentication input, and it is NULL for clients that do not provide it.

The row keeps the SQL as the client wrote it, with `vectorize('...')`, never the
rewritten SQL with the vector literal. The `vectorize_calls` and
`vectorize_cache_hits` columns count distinct texts, not occurrences. For
`semanticSearch`, they count the single query embedding as one call or one cache
hit, and `query` holds the natural language query.

`tool_arguments` holds the arguments specific to the tool, without `query` and
`purpose` (already stored in their own columns). For `semanticSearch` it records
`authors`, `title`, `limit`, `page` and `maxCharacters`; for `readOnlySqlQuery`
it records `maxCharacters`. Strings are capped at 200 characters, arrays at 20
items and the whole JSON at 4 KB. It never contains a vector.

`result_count` is the number of rows or documents returned. `result_total` is
the number of matches before paging for `semanticSearch`, and the same value as
`result_count` for `readOnlySqlQuery`. `result_meta` holds `hybrid`,
`semantic_error`, `semantic_source`, `total_pages`, `semantic_diagnostics` and,
for a large SQL read, `warning`.

`readOnlySqlQuery` appends a warning when a result has at least
`MCP_LARGE_RESULT_ROWS` rows (default 50) and selects `content` from
`content_chunks` (or uses `SELECT *`). The warning reminds the agent to read only
the `chunk_index` values returned by `semanticSearch`; `result_meta.warning` is
set to `large_chunk_read`.

`/mcp/log/` is a `(private)` page. It filters both the row query and the
aggregate query on `user_id = locals.user.id`; the loader never reads a user ID
from the URL. The `Token` column joins `api_tokens`, so a deleted token shows a
dash. The Arguments and Results columns show `tool_arguments`, `result_count`,
`result_total` and `result_meta`; rows written before 00017 show `—`. The detail
footer shows Client, Session, IP and Token; Session is `client_session_id`, with
a dash when the client sent no metadata.

## Troubleshooting

- `503 MCP read-only access disabled`: the reader password is missing, or the
  reader role could not be created. Check the migrate logs.
- `401 Unauthorized`: the request has no Bearer token, or the token is expired.
  A session cookie is not accepted.
- `PostgreSQL error: function vectorize(text) does not exist`: the rewrite did not
  see the call. It is inside a string, a dollar-quoted body, a `DO` block or a
  statement the server rejects. Only top-level SQL expressions are rewritten.
- `Session not found`: the process restarted, the session expired, or the
  request came from another replica. Re-run `initialize`.
- POST returns a redirect: use `/mcp/readonly/` with the trailing slash.

## Tests

`test/vectorize-sql.test.js` covers the rewrite without a database: comments,
strings, dollar-quoted bodies, accents, quoted identifiers, schema-qualified
calls, non-literal arguments, multiple statements, locking selects and duplicate
texts.

`test/semantic-search.test.js` covers filter normalization, paging bounds and
the mapping from `searchDocuments()` results to the MCP output, including
BM25-only snippets and `<mark>` tags.

`test/search-diagnostics.test.js` covers the semantic error classification, the
next-step messages and the large-read warning.

Run them with `pnpm test`.
