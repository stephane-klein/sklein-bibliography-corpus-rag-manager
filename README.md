# Sklein Bibliography Corpus RAG Manager

Manage a bibliography corpus and expose it to RAG pipelines.

Based on the [SvelteKit SSR skeleton](https://github.com/stephane-klein/sveltekit-ssr-skeleton/tree/main).

## Tech Stack

- Runtime: Node.js 26 (ESM)
- Package manager: pnpm
- Framework: SvelteKit 3 (SSR)
- Bundler: Vite
- Adapter: @sveltejs/adapter-node
- Database: PostgreSQL 18 with [ParadeDB pg_search (BM25)](https://github.com/paradedb/paradedb) and [pgvector](https://github.com/pgvector/pgvector)
- SQL client: [postgres](https://github.com/porsager/postgres)
- Migrations: [postgres-shift](https://github.com/porsager/postgres-shift)
- Mail: [nodemailer](https://nodemailer.com/) over SMTP
- CSS: [UnoCSS](https://unocss.dev/)
- i18n: [Paraglide JS](https://paraglidejs.com/)
- Lint / Format: ESLint + Prettier (eslint-plugin-svelte, prettier-plugin-svelte)
- Tooling: [Mise](https://mise.jdx.dev/), [Pitchfork](https://pitchfork.jdx.dev/)
- Dev mail: [Mailpit](https://github.com/axllent/mailpit) (SMTP + web UI)
- Containers: Podman Compose
- Secret detection: [gitleaks](https://github.com/gitleaks/gitleaks)

## Getting Started

The dev-stack services run under [Pitchfork](https://pitchfork.jdx.dev/): one
command starts PostgreSQL, Mailpit, the migrations, the seed and the dev server,
in dependency order and in the background. Safe to rerun.

```bash
$ mise install                # install Node.js, pnpm and Pitchfork via mise
$ pnpm install
$ pitchfork start webapp      # start postgres and mailpit,
                              # run migrate and seed,
                              # then the dev server
$ pitchfork logs webapp --tail
```

Open http://localhost:5173 in your browser.

Default user (see [`./sqls/seeds/00002_users.sql`](./sqls/seeds/00002_users.sql)):

- email: `alice@example.com`
- password: `password123`

To send a test email, run `mise run send-test-mail`. Mailpit captures all the
emails it sends: run `pitchfork proxy status` to get its URL.

### Importing corpus contents

`mise run import-contents` loads the Markdown files into
`hierarchical_content_nodes`. The task accepts a directory or a single Markdown
file:

```bash
$ mise run import-contents
$ mise run import-contents contents/single-document-texts/mr-phi
$ mise run import-contents contents/single-document-texts/mr-phi/2017-05-24_le-principe-de-condorcet-1-2-une-norme-democratique-grain-de-philo-9.fr.md
$ mise run import-contents contents/single-document-texts/mr-phi --dry-run
```

The webapp must be running. The CLI sends each document to
`PUT /api/v1/admin/hierarchical-content-nodes/sync`.

`--prune` removes rows whose source file no longer exists. It only works with a
directory.

### Testing the built version of the webapp locally

```bash
$ pitchfork start preview
```

Open http://localhost:4173 in your browser.

### Stopping and cleaning up

```bash
$ pitchfork stop --local      # stop the daemons (PostgreSQL volume preserved)
$ mise run teardown           # stop the daemons, remove containers and volumes (destructive, deletes PostgreSQL data)
```

## Local monitoring stack (VictoriaMetrics + Grafana)

[`victoriametrics-grafana-test-dev/`](./victoriametrics-grafana-test-dev/)
contains a Podman Compose stack to test the metrics locally: VictoriaMetrics
scrapes `/-/metrics` and Grafana shows the result through provisioned dashboards.

```bash
$ pitchfork start grafana     # VictoriaMetrics + Grafana
```

Go to Grafana: <http://localhost:3001> — `admin` / `admin123`.
