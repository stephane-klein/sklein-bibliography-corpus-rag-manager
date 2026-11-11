# Sklein Bibliography Corpus RAG Manager

Manage a bibliography corpus and expose it to RAG pipelines.

Based on the [SvelteKit SSR skeleton](https://github.com/stephane-klein/sveltekit-ssr-skeleton/tree/main).

## Tech Stack

- Runtime: Node.js 26 (ESM)
- Package manager: pnpm
- Framework: SvelteKit 3 (SSR)
- Bundler: Vite
- Adapter: @sveltejs/adapter-node
- Database: PostgreSQL 18 with [ParadeDB pg_search (BM25)](https://github.com/paradedb/paradedb), [pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) and [pgvector](https://github.com/pgvector/pgvector)
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
`hierarchical_content_nodes` and, when a `.md.yaml` sidecar and its
`.md.embeddings.bin` exist, imports the chunks into `content_chunks`. The task
accepts a directory or a single Markdown file:

```bash
$ mise run import-contents
$ mise run import-contents contents/single-document-texts/mr-phi
$ mise run import-contents contents/single-document-texts/mr-phi/2017-05-24_le-principe-de-condorcet-1-2-une-norme-democratique-grain-de-philo-9.fr.md
$ mise run import-contents contents/single-document-texts/mr-phi --dry-run
```

The webapp must be running with the `content_chunks` migration applied. The CLI
sends each document to `PUT /api/v1/admin/hierarchical-content-nodes/sync`, then
its chunks to `PUT /api/v1/admin/hierarchical-content-chunks/sync`.

`--prune` removes rows whose source file no longer exists. It only works with a
directory. `--skip-embeddings` imports documents only. `--require-embeddings`
fails when a document has no sidecar. By default, a document without a sidecar
is imported and its embeddings are reported as missing.

### Searching documents

The `/documents/` page searches the document catalog with BM25. Enable
"Semantic search" to embed the query with Voyage and fuse the best matching
chunks with the BM25 ranking. Query vectors are cached in `query_embedding_cache`,
keyed by the normalized query, the provider, the model and the dimension. The
page falls back to BM25 when Voyage, the cache, or the `content_chunks` table is
unavailable.

### Generating sidecars

`mise run generate-sidecars` writes one `.md.yaml` sidecar next to each Markdown
document under `contents/single-document-texts`. The task accepts a directory or
a single Markdown file:

```bash
$ mise run generate-sidecars
$ mise run generate-sidecars contents/single-document-texts/mr-phi
$ mise run generate-sidecars contents/single-document-texts/mr-phi/2017-05-24_le-principe-de-condorcet-1-2-une-norme-democratique-grain-de-philo-9.fr.md
$ mise run generate-sidecars --dry-run
$ mise run generate-sidecars --force
```

The command does not vectorize anything. It splits each document into
paragraphs, counts tokens with the `cl100k_base` tokenizer, and stores the
result in `source.md.yaml` next to `source.md`. The file contains a `manifest`
section and a `chunks` list; each chunk has its heading path and token count.

By default, the command skips a sidecar when its manifest has the same source
hash, schema version, tokenizer, threshold and splitter, and when the number of
chunks matches `chunk_count`. `--force` regenerates every sidecar. `--dry-run`
reports what would be written without writing.

`yq` reads the sidecars directly:

```bash
$ yq '.' contents/single-document-texts/mr-phi/2017-05-24_le-principe-de-condorcet-1-2-une-norme-democratique-grain-de-philo-9.fr.md.yaml
$ yq '.chunks[] | [.chunk_index, .content_token_count, .heading_path] | @tsv' contents/single-document-texts/mr-phi/2017-05-24_le-principe-de-condorcet-1-2-une-norme-democratique-grain-de-philo-9.fr.md.yaml
$ yq -o=json '.' contents/single-document-texts/mr-phi/2017-05-24_le-principe-de-condorcet-1-2-une-norme-democratique-grain-de-philo-9.fr.md.yaml | jq .
```

The scope is limited to `contents/single-document-texts`. Books under
`contents/books/` need hierarchy fields and will be handled later.

### Generating embeddings

`mise run generate-embeddings` reads the `.md.yaml` sidecars, asks the webapp
for vectors, and writes one `.md.embeddings.bin` file next to each sidecar. The
command does not write to PostgreSQL.

The webapp must be running with a Voyage API key:

```bash
$ export SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_API_KEY="pa-..."
```

Generate the sidecars first, then the embeddings:

```bash
$ mise run generate-sidecars
$ mise run generate-embeddings
$ mise run generate-embeddings contents/single-document-texts/mr-phi
$ mise run generate-embeddings --dry-run
$ mise run generate-embeddings --force
```

The CLI calls `GET /api/v1/admin/embeddings` to read the document model and
dimension, then `POST /api/v1/admin/embeddings` with `input_type: "document"` and
one document's chunks. The webapp calls Voyage with AI SDK, and the API key never
leaves the server.

The document model is `voyage-4` with 1024 dimensions. Queries use
`voyage-4-lite`; both models share the same embedding space, so you can change
the query model without reindexing. The webapp returns `query_model` in the
embedding configuration for the future search endpoint.

Each binary file starts with a JSON header line (format, provider, model,
dimension, chunk count, source hash, input format, input type, strategy and
cost) followed by Float32LE vectors. The YAML manifest stores
`embedding_provider`, `embedding_model`, `dimension`, `embedding_file`,
`embedding_format`, `embedding_input_format`, `embedding_input_type` and
`embedding_strategy`.

The `cost` block records the number of tokens, the amount in US dollars and the
price per million tokens used at generation time:

```json
"cost": {
  "amount_usd": 0.0001518,
  "basis": "list_price",
  "tokens": 2530,
  "price_per_million_tokens_usd": 0.06
}
```

The amount is the list price. Voyage's 200 million free tokens are not deducted,
so the value is an estimate of what the call would cost, not the billed amount.
Prices are hardcoded in `src/lib/server/embedding.js` for `voyage-4`
($0.06 per million tokens) and `voyage-4-lite` ($0.02 per million tokens). Any
other model gives a null cost, and the command reports the total as partial.

The command prints the tokens and the total cost of the calls it made. Files
skipped because their embeddings are current do not add to that total.
`--dry-run` makes no call, so it prints a null cost.

By default, the command skips a document when the manifest and the binary header
match the source hash, the provider, the model, the dimension and the embedding
strategy. `--force` regenerates everything. Existing binary files without a
`cost` block stay valid; run `mise run generate-embeddings --force` once to add
the metadata to the whole corpus. `--dry-run` reports what would be embedded
without generating vectors.

The embedding input is `heading_path + "\n\n" + text`. `text` stays the exact
paragraph used for display and BM25.

Override the defaults with
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_PROVIDER`,
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_MODEL`,
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_QUERY_MODEL`,
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_DIMENSION` and optionally
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_BASE_URL`. Set
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_PROVIDER=openai` to use OpenAI
instead of Voyage.

### MCP read-only server

The application exposes a read-only MCP endpoint at `/mcp/readonly/`. It lets an
MCP client write SQL against the corpus and, when the query needs a vector,
call a virtual `vectorize('...')` function. The public documentation page is
`/mcp/`.

The endpoint authenticates with an API token. Create one in
`/my/tokens/`, then configure the client:

```json
{
  "mcpServers": {
    "bibliography": {
      "type": "http",
      "url": "https://your-host/mcp/readonly/",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

The trailing slash matters: the application uses `trailingSlash = "always"`.
Some MCP clients do not follow a 308 redirect on POST.

The server exposes one tool, `readOnlySqlQuery`. It accepts one `SELECT`,
`WITH ... SELECT` or `EXPLAIN SELECT` statement and requires a `purpose` string
for the access log.

`vectorize('some text')` is not a PostgreSQL function. The MCP server finds the
call in the SQL, embeds the literal text with the query model, replaces the call
with a `vector` literal, then executes the rewritten query. PostgreSQL never
sees `vectorize`.

```sql
SELECT c.content_node_id,
       n.title,
       c.heading_path,
       left(c.content, 500) AS excerpt,
       c.embedding <=> vectorize('le principe de condorcet') AS distance
  FROM content_chunks c
  JOIN hierarchical_content_nodes n ON n.id = c.content_node_id
 WHERE c.embedding IS NOT NULL
   AND c.embedding_model = 'voyage-4'
   AND c.embedding_strategy = 'standard'
 ORDER BY distance
 LIMIT 10;
```

The argument must be one string literal. `vectorize(c.content)` is rejected
because the server cannot know the value before running the query. A query can
use at most 8 distinct texts, and each text is limited to 2000 characters.
Identical texts share one embedding call and one vector. Query embeddings reuse
the `query_embedding_cache` table.

The MCP server connects with a dedicated role,
`sklein_bibliography_mcp_reader` by default. `pnpm migrate` creates the role when
the application role is allowed to `CREATE ROLE`, then grants `SELECT` on
`hierarchical_content_nodes` and `content_chunks`. Set
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_READONLY_POSTGRES_PASSWORD` to
enable the endpoint; without it the endpoint returns 503. Override the role name
with
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_READONLY_POSTGRES_ROLE`.

Optional limits:

- `SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_MAX_OUTPUT_CHARS` (default 200000)
- `SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_DEFAULT_MAX_OUTPUT_CHARS` (default 50000)
- `SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_MAX_QUERY_CHARS` (default 100000)
- `SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_MAX_VECTORIZE_TEXTS` (default 8)
- `SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_MAX_VECTORIZE_TEXT_CHARS` (default 2000)

Each tool call is recorded in `mcp_access_log` and shown on `/mcp/log/`. The
page shows only the calls of the signed-in user. It shows the query as written,
the embedding calls, tokens and cost, but never the vector itself.

MCP sessions live in memory. The endpoint is meant for a single replica; a
multi-replica deployment needs a shared session store or sticky sessions.

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
