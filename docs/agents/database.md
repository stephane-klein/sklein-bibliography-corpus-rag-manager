# Local Database Access

## Why the connection URL is dynamic

`compose.yaml` publishes PostgreSQL on `5432` without a fixed host port:

```yaml
ports:
  - 5432
```

Podman therefore picks a free host port, and the port changes when the
container is recreated. `scripts/load_postgres_variables.sh` reads the current
port and credentials from the running container, then exports
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_URL`. `mise.toml` sources that
script from `[env]._.source`, so every `mise run` sees a fresh URL.

Do not hardcode the URL in a script or an editor configuration.

## Tasks

`execute-read-sql` runs one statement in a read-only transaction:

```bash
$ mise run execute-read-sql -- "SELECT ..."
```

`scripts/execute-sql.sh` sets:

- `default_transaction_read_only=on`
- `statement_timeout=15000`
- `lock_timeout=5000`
- `paradedb.planner_warnings=off`

The SQL argument travels through the `usage_sql` environment variable, so single
quotes, double quotes and newlines are safe.

`execute-write-sql` runs the same command without the read-only setting. Use it
only when a write is intended:

```bash
$ mise run execute-write-sql -- "UPDATE ..."
```

`enter-in-pg` opens an interactive `psql` session with the same URL.

When `scripts/execute-sql.sh` is called directly, it re-executes itself through
`mise exec` once, so the project environment is loaded even outside a mise task.

## Error messages

- `PostgreSQL is not reachable`: the container is stopped, or the environment
  script could not read its port. Run `pitchfork start postgres`.
- `permission denied for ...`: a write ran through `execute-read-sql`.
- `canceling statement due to statement timeout`: the query ran longer than
  15 seconds. Add a `LIMIT`, narrow the `WHERE` clause, or use `enter-in-pg`.

## Role and safety

The task connects with the application role (`postgres` in the local compose
stack). The read-only setting is a guard rail, not a security boundary: a
superuser can still turn it off inside the statement. Use `execute-write-sql`
only when a write is intended.

## Schema overview

- `hierarchical_content_nodes` — one row per content node: a work or part
  without a Markdown file, or a Markdown-backed section. `parent_id`, `depth`
  and `position` describe the tree. `content` is the source of truth;
  `content_fr` and `content_en` are generated fields used by the single BM25
  index (French and English stemmers).
- `content_chunks` — one row per paragraph, with `embedding vector(1024)`.
- `content_chunks.content_node_id` references `hierarchical_content_nodes.id`.
- `sqls/schema.sql` is the consolidated schema; `sqls/migrations/` is the
  versioned history.

Useful queries:

```sql
SELECT count(*) FROM hierarchical_content_nodes;
SELECT id, slug, title FROM hierarchical_content_nodes ORDER BY id DESC LIMIT 10;
SELECT slug, depth, position, parent_id, title
  FROM hierarchical_content_nodes
 ORDER BY depth, position
 LIMIT 20;
SELECT count(*) FROM content_chunks WHERE embedding IS NOT NULL;
```

Run `mise run execute-read-sql -- "\dt"` to list every table, and
`mise run execute-read-sql -- "\d hierarchical_content_nodes"` to show the
columns, indexes and constraints of one table.
