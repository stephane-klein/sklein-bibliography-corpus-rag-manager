# Deployment Playground

Local playground for testing the application in a production-like environment.

## Prerequisites

Allow rootless Podman to bind ports 80 and 443 (one-time setup):

```bash
$ mise run sysctl-unprivileged-port
```

## Setup

```bash
$ mise run up
```

This task executes:

```bash
$ mise run build-dev-image
$ podman compose run --rm app seed
$ podman compose up -d app caddy
$ mise show-url
Open your browser on https://app.127.0.0.1.sslip.io
```

### Email testing with Mailpit

Mailpit is available at https://mailpit.127.0.0.1.sslip.io — it captures all
outgoing emails sent by the application (SMTP on `mailpit:1025`).

### OpenID Connect with Authelia

After starting the playground, create an OIDC user:

```bash
$ curl -k -X POST \
    -H "Authorization: Bearer playground-admin-token-change-me-in-prod" \
    -H "Content-Type: application/json" \
    -d '{"email":"john.doe@example.com","display_name":"John Doe","oidc_issuer":"https://auth.127.0.0.1.sslip.io","oidc_subject":"johndoe"}' \
    https://app.127.0.0.1.sslip.io/api/v1/admin/users | jq
```

Then open https://app.127.0.0.1.sslip.io and click **Sign in with Authelia**.
Accept the self-signed certificate warning. Log in with `johndoe` / `testpassword`.

## Tear down

```bash
$ podman compose down -v
```
