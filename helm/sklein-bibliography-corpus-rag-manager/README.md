# sklein-bibliography-corpus-rag-manager Helm chart

Deploys the sklein-bibliography-corpus-rag-manager service on Kubernetes with a CloudNativePG PostgreSQL cluster
in the same namespace.

The deployment of this chart was tested in a
[homelab playground](https://github.com/stephane-klein/homelab.sklein.xyz/tree/main/playground/sveltekit-ssr-skeleton).

The container image is published on
[GitHub Container Registry](https://github.com/users/stephane-klein/packages/container/package/sklein-bibliography-corpus-rag-manager):
`ghcr.io/stephane-klein/sklein-bibliography-corpus-rag-manager`.

## Prerequisites

- **Kubernetes cluster** (tested on k3s 1.36)
- **Helm** 3.8+
- **CloudNativePG operator** 1.28+ with Kubernetes image volume support

## Quick start

```bash
$ kubectl create namespace sklein-bibliography-corpus-rag-manager
$ helm upgrade --install sklein-bibliography-corpus-rag-manager oci://ghcr.io/stephane-klein/charts/sklein-bibliography-corpus-rag-manager \
    --namespace sklein-bibliography-corpus-rag-manager \
    --set ingress.enabled=true \
    --set ingress.host=sklein-bibliography-corpus-rag-manager.example.com
```

## Configuration

See [values.yaml](https://github.com/stephane-klein/sklein-bibliography-corpus-rag-manager/blob/main/helm/sklein-bibliography-corpus-rag-manager/values.yaml).

Pass custom values via `--set` or a YAML file:

```bash
$ helm upgrade --install sklein-bibliography-corpus-rag-manager oci://ghcr.io/stephane-klein/sklein-bibliography-corpus-rag-manager \
    --namespace sklein-bibliography-corpus-rag-manager \
    -f my-values.yaml
```

## How to test Helm chart

```sh
$ mise run publish-chart
$ mise run deploy-helm-test
...
$ mise run destroy-helm-test
```

## How it works

### PostgreSQL connection

The chart creates a CNPG `Cluster` resource in the same namespace. The CNPG
operator automatically generates an app secret named `<clusterName>-app`
(default: `sklein-bibliography-corpus-rag-manager-app`) with keys: `host`, `port`, `dbname`, `username`,
`password`. The connection URL is built at pod startup as
`postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)` and
exposed via `SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_URL`.

### PostgreSQL search extensions

The cluster runs the CloudNativePG operand image with the ParadeDB extension
image mounted through `spec.postgresql.extensions`. `shared_preload_libraries`
includes `pg_search`. The application role is a superuser, so the migration can
create the untrusted `pg_search` extension and its `pgvector` dependency. The
BM25 index is created by the application migration; PostgreSQL maintains it
automatically on every write.

The `cnpg.extensions` values pin the pgvector and pg_search extension images.
Keep them aligned with `paradedb/paradedb` used in development. ParadeDB
Community does not replicate its index physically, so keep `cnpg.instances` at
`1`.

### Embeddings

The embedding endpoint uses Voyage by default. Configure it with:

- `embedding.provider` (default `voyage`; set `openai` for the OpenAI-compatible client)
- `embedding.model` (default `voyage-4`)
- `embedding.queryModel` (default `voyage-4-lite`)
- `embedding.dimension` (default `1024`)
- `embedding.baseUrl` (optional)
- `embedding.apiKey` (only when `secrets.existingSecret` is not set)

When `secrets.existingSecret` is set, the Secret must also expose
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_EMBEDDING_API_KEY`.

### MCP read-only server

The `/mcp/readonly/` endpoint uses a dedicated PostgreSQL role. During
`migrate`, the application creates the role and grants `SELECT` on
`hierarchical_content_nodes` and `content_chunks`. Because the chart sets
`cnpg.appRoleSuperuser: true`, the application role can create it.

Configure it with:

- `mcp.readerRole` (default `sklein_bibliography_mcp_reader`)
- `mcp.readerPassword` (only when `secrets.existingSecret` is not set)

When `secrets.existingSecret` is set, the Secret must expose
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_READONLY_POSTGRES_PASSWORD`. Leave
the password unset to keep the MCP endpoint disabled; the application and the
rest of the API keep working.

The access log page is `/mcp/log/`. It shows only the signed-in user's calls.

MCP sessions are held in memory. Keep `app.replicaCount` at 1 unless a shared
session store or sticky sessions are added.

### OpenID Connect (OIDC)

The application can authenticate users via OpenID Connect. The implementation
is currently specific to **Authelia** (endpoint paths are hardcoded to
Authelia's convention).

`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ORIGIN` (required for the OIDC
callback URL) is automatically derived from `ingress.host` when ingress is
enabled. Set `origin` explicitly to override.

This variable only feeds the OIDC callback URL. SvelteKit derives the origin
used for CSRF checks from the `Host` and `X-Forwarded-Proto` headers that the
ingress already forwards, so no build-time `paths.origin` is needed.

Enable OIDC with:

```bash
$ helm upgrade --install sklein-bibliography-corpus-rag-manager oci://ghcr.io/stephane-klein/charts/sklein-bibliography-corpus-rag-manager \
    --namespace sklein-bibliography-corpus-rag-manager \
    --set ingress.enabled=true \
    --set ingress.host=sklein-bibliography-corpus-rag-manager.example.com \
    --set adminToken="$(openssl rand -hex 32)" \
    --set oidc.enabled=true \
    --set oidc.issuer=https://auth.example.com \
    --set oidc.clientId=sklein-bibliography-corpus-rag-manager \
    --set oidc.clientSecret=...
```

## Managing users (idempotent GitOps)

After deploying the chart, provision or reconcile the set of users idempotently
through the admin API. This is the GitOps pattern: a configuration file declares
the desired users, and a runner applies it — create/update/delete in one atomic
`PUT /api/v1/admin/users/sync`, re-applicable without error and with a stable
final state.

**Prerequisite** — the admin API must be enabled: set `adminToken` at install
time (at least 32 characters), or use an existing secret exposing the
`SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN` key (`secrets.existingSecret`).

Sync users against the deployed application:

```bash
$ curl -s -X PUT -H "Authorization: Bearer ${SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    --data @api-payloads-examples/users-sync.json \
    https://sklein-bibliography-corpus-rag-manager.example.com/api/v1/admin/users/sync | jq
```

A ready-to-use payload lives in
[`api-payloads-examples/users-sync.json`](../../api-payloads-examples/users-sync.json)
at the repository root — see the [root README section](../../README.md) for the
idempotency details and the single-user `PUT /api/v1/admin/users` variant.

### Managing API tokens in the same payload

Each `upsert` item accepts an optional `tokens` object. Tokens are identified by
`(user_id, name)`, so the name is the stable key across environments.

```json
{
  "upsert": [
    {
      "email": "alice@example.com",
      "display_name": "Alice Admin",
      "tokens": {
        "upsert": [
          {
            "name": "mcp-readonly",
            "token": "REPLACE_ME_ALICE_MCP_TOKEN_32_CHARS_MIN",
            "expires_at": "2027-06-01T00:00:00Z"
          },
          { "name": "ci-deploy", "expires_at": null }
        ],
        "delete": ["old-token"]
      }
    }
  ]
}
```

The two token declarations behave differently:

- `{ "name": "...", "token": "..." }` sets an exact value. Re-applying the same
  value is a no-op. This is the mode to use when the token comes from a secret
  manager.
- `{ "name": "..." }` creates the token with a generated value when it does not
  exist. An existing token keeps its value. The generated value is returned once
  in `data.raw_tokens`; store it immediately.

`expires_at` is an absolute ISO 8601 date. `null` means the token never expires.
Omitting the field keeps the current expiration, which keeps the payload
idempotent. `tokens.delete` removes the listed names; deleting an unknown name
is a no-op.

To rotate a token, change its `token` value in the source secret and re-apply the
payload. The sync replaces the stored hash. A token generated by the server has
no readable value, so rotate it by deleting it in one sync and creating it again
in a later sync, or by starting to supply an explicit value.

Never apply the example payload as-is in production: replace the placeholder
token values and inject them from your secret manager.

The endpoint stores only the SHA-256 hash. A value supplied in `token` is never
echoed in the response. Values generated by the server appear only in
`data.raw_tokens`, and only on the request that created them.

Filter the response before logging it in CI:

```bash
$ curl -s -X PUT -H "Authorization: Bearer ${SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    --data @api-payloads-examples/users-sync.json \
    https://sklein-bibliography-corpus-rag-manager.example.com/api/v1/admin/users/sync \
    | jq '{users: (.data.created + .data.updated), tokens: .data.tokens, raw_tokens: .data.raw_tokens}'
```
