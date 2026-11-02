# Stored Functions Implementation Notes

## Architecture Overview

- **File**: `sqls/functions.sql` — stored functions, written by hand
- **Loaded by**: `src/migrate.js`, after the `postgres-shift` migrations
- **Reloaded**: on **every** `pnpm migrate` (not versioned as a migration)

`sqls/migrations/` is versioned and each migration runs exactly once (tracked by
`postgres-shift`). Stored functions are kept out of that history: `functions.sql`
is the current source of truth and is re-executed in full on every migrate, so
editing a function and re-running `pnpm migrate` is enough to apply the change.

```
src/migrate.js
    shift({ sql, path: MIGRATIONS_PATH, ... })   # once per migration
    logger.info("Loading SQL functions")
    sql.begin(async (tx) => tx.file(FUNCTIONS_PATH))   # every run
    logger.info("SQL functions loaded")
```

This is why `sqls/functions.sql` ships in the production image (`Containerfile`
copies `sqls/`) and why `entrypoint.sh` runs `src/migrate.js` before `serve`.

## Idempotence

Because the file is reloaded on every run, it MUST be idempotent: each function
is preceded by `DROP FUNCTION IF EXISTS`, then recreated with `CREATE FUNCTION`.

A migration that drops or renames a table used by a function here must ship the
matching update of `sqls/functions.sql`, otherwise the next `pnpm migrate` fails
loudly at the `CREATE FUNCTION` step.

## Silencing idempotent NOTICEs

An idempotent `DROP FUNCTION IF EXISTS x` emits a
`NOTICE: function x() does not exist, skipping` when `x` is not yet present
(first load). Those NOTICEs are harmless but noisy.

`src/lib/server/pg.js` installs a pino `onnotice` hook that logs every PostgreSQL
notice at `debug` level. To keep that channel meaningful, silence the _expected_
NOTICEs at the source, scoped to the loading transaction only:

```sql
SET LOCAL client_min_messages = warning;

DROP FUNCTION IF EXISTS my_function();

SET LOCAL client_min_messages = notice;

CREATE FUNCTION my_function() RETURNS bigint
LANGUAGE sql
AS $$
    SELECT count(*) FROM contacts;
$$;
```

`SET LOCAL` applies to the current transaction only — the one opened by
`sql.begin` in `src/migrate.js` — so the value is automatically restored
afterwards. The `CREATE FUNCTION` statements still emit their own NOTICEs.

Do not silence NOTICEs globally: silence the ones you expect, keep the rest.

## Adding a function

1. Uncomment/copy the template at the top of `sqls/functions.sql`.
2. Keep the `DROP FUNCTION IF EXISTS` → `CREATE FUNCTION` order (idempotence).
3. Wrap the `DROP`s in `SET LOCAL client_min_messages = warning` /
   `... = notice` when they would emit NOTICEs.
4. Prefer `LANGUAGE sql` over `LANGUAGE plpgsql` when the body is declarative
   (see `AGENTS.md` → Database).
5. Add a `COMMENT ON FUNCTION ...` describing the function.
6. Run `pnpm migrate` twice to confirm it is idempotent and silent.

## Relationship with schema.sql

`sqls/schema.sql` is the hand-written consolidated schema (tables, indexes,
constraints). It is a reference document, **not** executed by `pnpm migrate`.
`sqls/functions.sql` is the executable source of truth for stored functions.
