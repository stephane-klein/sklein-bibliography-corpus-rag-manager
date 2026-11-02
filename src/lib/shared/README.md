# `#lib/shared/`

Pure / isomorphic modules usable from **both** server and client code, imported
via `#lib/shared/...`.

A module belongs here only if it is pure: no `node:` imports, no database
access, no `process.env`, no browser-only globals at module scope. This is what
makes it safe to import from a client component as well as from server code.

Layout rules (see AGENTS.md):

- server-only code → `src/lib/server/` (`#lib/server/...`)
- pure / isomorphic code → `src/lib/shared/` (`#lib/shared/...`)
- client-only Svelte components → `src/lib/client/` (`#lib/client/...`)
- `src/lib/backend/` is forbidden

This directory is currently empty of modules; it exists so new pure modules have
an obvious home.
