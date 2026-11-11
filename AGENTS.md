# Agent Instructions

## Project Context

Manage a bibliography corpus and expose it to RAG pipelines.

## Language Policy

- **All project content must be in English**: source code, comments, commit messages, and documentation.
- **Human conversations in OpenCode remain in French**.

## Package Manager Policy

- Always use `pnpm` for installing, adding, and removing packages.
- Never use `npm` or `yarn`.

## Code Quality

This project uses **ESLint** with `eslint-plugin-svelte` for linting and
**Prettier** with `prettier-plugin-svelte` for formatting:

- `pnpm lint` — check for code issues
- `pnpm format` — auto-format code
- `pnpm check` — run both (format check + lint)

Configuration: `eslint.config.js`, `prettier.config.js`

## Database

This project uses **PostgreSQL** as its database, accessed directly with raw SQL — **no ORM**.

SQL queries are executed using the [`postgres`](https://github.com/porsager/postgres) library (package name: `postgres`).

Migrations are managed by [`postgres-shift`](https://github.com/porsager/postgres-shift) and located in `sqls/migrations/`.

The complete schema (consolidated) is written by hand in `sqls/schema.sql`.

Stored functions live in `sqls/functions.sql`, which is **reloaded in full on every
`pnpm migrate`** (outside the versioned migration history). Keep it idempotent:
prefer `CREATE OR REPLACE FUNCTION`; use `DROP FUNCTION IF EXISTS` only when the
signature changes, because a function referenced by a column `DEFAULT` cannot be
dropped while the default depends on it. See
[`docs/agents/sql-functions.md`](docs/agents/sql-functions.md).

When adding stored functions, prefer pure `LANGUAGE sql` over `LANGUAGE plpgsql`
whenever the body is declarative (a plain sequence of DML/SELECT statements, no
control flow). Reserve `LANGUAGE plpgsql` for functions that genuinely need
procedural features: `IF`, loops, `RAISE EXCEPTION`, dynamic SQL (`EXECUTE`), or
`SELECT ... INTO` variables.

## Example / Scaffolding Files

The following files are examples meant to be replaced with your actual project code:

- `sqls/migrations/00001_initial/` — example migration (kept for numbering; `00015_drop_contacts.sql` drops the sample table)
- `sqls/seeds/00002_users.sql` — demo account (`alice@example.com` / `password123`)
- `sqls/schema.sql` — example consolidated schema

These files are marked with comments (`-- Example`) at the top. Replace or remove them as needed.

> **Remove this entire section once the example files have been replaced or deleted.**

## SvelteKit

This project uses **SvelteKit 3** with `@sveltejs/adapter-node` for SSR.

### Standalone endpoints and authentication

Endpoints under `(api)/` — and any other `+server.js` route outside the
`(private)` group — are **not** covered by the `(private)/+layout.server.js`
guard. Every handler that requires an authenticated user must call
`requireUser(event)` from `#lib/server/require-user.js` before doing any work:

```js
const authError = requireUser(event);
if (authError) return authError;
```

`requireUser` returns either a `401` `application/problem+json` response (built
by `#lib/server/problem.js`) or `null`. Do not hand-roll the `event.locals.user`
check inline.

### Library code layout

Library code is split by where it is allowed to run:

- `src/lib/server/` — **server-only** code (DB access via `postgres`, auth,
  mailer, `node:` APIs, `process.env`, secrets, ...), imported via
  `#lib/server/...`. SvelteKit enforces this at build time: its
  `vite-plugin-sveltekit-guard` throws
  `Cannot import $lib/server/... into code that runs in the browser` if a client
  entrypoint (a Svelte component, a universal `load`, a client/universal hook)
  imports one. This is a security guarantee — never place server-only code
  anywhere else.
- `src/lib/shared/` — **pure / isomorphic** modules (no Node, DB, or environment
  access) needed from BOTH the server and client Svelte components, imported via
  `#lib/shared/...`. If a module has to be importable by a client component, it
  must be pure (no `node:` imports, no DB, no `process.env`) and belong here.
- `src/lib/client/` — **client-only** Svelte components, imported via
  `#lib/client/...`.

`src/lib/backend/` is **forbidden**: it no longer exists, never create it and
never import from it. When adding a new module, decide its home up front:
server-only → `src/lib/server/`, isomorphic/pure → `src/lib/shared/`,
client-only component → `src/lib/client/`.

### Container build (multi-stage)

The `Containerfile` uses a two-stage build:

1. **Stage 1 (`build`)** — installs all deps, runs `pnpm build`
2. **Stage 2 (production)** — installs only prod deps, copies `build/`, `src/db.js`, `src/logger.js`, `src/migrate.js`, `src/seed.js`, and `sqls/`

The production image runs `node /app/build/index.js` via the `serve` command in `entrypoint.sh` (which also runs migrations before starting the server).

## Node.js Paradigms

### Code style

- Inline simple logic: prefer inline expressions over extracting helper functions for trivial operations (e.g., single `await sql` calls).
- Extract functions only when code reuse, readability, or testability genuinely benefits.

### Functional style

- Prefer chaining `.map()`, `.filter()`, `.reduce()`, `.forEach()` over imperative loops.
- Avoid intermediate variables without semantic value (_expression-oriented_):
  prefer `getMonths().map(...)` to `const months = getMonths(); months.map(...)`.
  Prefer `(await Promise.all(...)).forEach(...)` to `const results = []; for (...)`.
  If a step is complex, prefer a comment over a superfluous variable.
- Avoid mutations: no `.push()` in a loop if `.map()` suffices (_immutability_).

### Import naming

When a module exports generic names (e.g., `runWithMetrics`, `summarize`) that
only make sense within the module's domain, use `as` at the import site to make
the domain explicit:

```js
import { runWithMetrics as runWithPgMetrics, summarize as summarizePgMetrics } from "#lib/server/pg-metrics.js";
```

### To avoid

- Tacit programming / point-free style: always explicitly name function arguments.
  Prefer `[1,2,3].map(n => add1(n))` to `[1,2,3].map(add1)`.

## OpenAPI Spec Sync

The OpenAPI specification is dynamically generated in
`src/routes/(api)/api/v1/openapi.json/+server.js`.

**Any change to request/response schemas in route handlers must be reflected
here too.** The Scalar API reference UI at `/api/reference` consumes this spec.

## i18n — Paraglide JS

This project uses **Paraglide JS** (`@inlang/paraglide-js`) for
internationalization.

- Translation files: `messages/en.json` and `messages/fr.json`
- Usage in Svelte components:
  ```svelte
  <script>
    import { m } from "#lib/paraglide/messages.js";
  </script>

  <h1>{m.welcome_title()}</h1>
  ```

**Whenever you create or modify a page/component with user-facing text:**

1.  Add all new keys to `messages/en.json` (English source) and `messages/fr.json`
    (French translation)
2.  Replace hardcoded strings with `{m.key_name()}` calls
3.  Run `pnpm build` to regenerate the compiled message functions in
    `src/lib/paraglide/`

Key naming convention: use prefix per page/section (e.g., `login_title`,
`login_email_label`, `dashboard_welcome`).

**Implementation details** (cookie management, AsyncLocalStorage nesting, httpOnly
pitfall, email templates, login flows): see `docs/agents/i18n.md`.

**Architecture decision**: see [`docs/decisions/2026-07_001-paraglide-i18n.md`](docs/decisions/2026-07_001-paraglide-i18n.md).

## Supplementary Documentation

- [`docs/agents/`](docs/agents/) — operational snapshots of subsystems (loaded on demand by the agent)
- [`docs/decisions/`](docs/decisions/) — architecture decision records
- `.opencode/skills/new-decision/` — skill for creating new decision records

## Documentation Maintenance

Remove from this file any section or reference that becomes obsolete after file deletions or structural changes. Keep AGENTS.md up to date.
