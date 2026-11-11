# MCP read-only server

The application exposes an MCP endpoint at `/mcp/readonly/`. It lets an MCP
client run one read-only SQL statement against the bibliography corpus. The tool
is declared in [`src/lib/server/mcp/mcp-readonly-tools.js`](../../src/lib/server/mcp/mcp-readonly-tools.js).

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
- no `SELECT INTO`, `FOR UPDATE`/`FOR SHARE`, DDL, `DO`, `COPY` or multiple
  statements

## Embeddings and cost

`src/lib/server/mcp/query-embeddings.js` reads `query_embedding_cache`, embeds
the misses in one `embedTexts(..., { inputType: "query" })` call, and writes the
new vectors back. `vectorize` always uses the query model (`voyage-4-lite` by
default), not the document model stored in `content_chunks.embedding_model`.

The result carries `calls`, `cacheHits`, `tokens`, `costUsd` and `ms`. These
values go to `mcp_access_log`.

## Access log

`mcp_access_log` is created by
`sqls/migrations/00016_mcp_access_log.sql`. `recordMcpAccess()` inserts one row
per tool call in a `finally` block, so a query that fails after embedding still
records the embedding cost.

The row keeps the SQL as the client wrote it, with `vectorize('...')`, never the
rewritten SQL with the vector literal. The `vectorize_calls` and
`vectorize_cache_hits` columns count distinct texts, not occurrences.

`/mcp/log/` is a `(private)` page. It filters both the row query and the
aggregate query on `user_id = locals.user.id`; the loader never reads a user ID
from the URL. The `Token` column joins `api_tokens`, so a deleted token shows a
dash.

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
texts. Run it with `pnpm test`.
