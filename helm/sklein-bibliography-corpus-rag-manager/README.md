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
