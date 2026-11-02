# VictoriaMetrics + Grafana test environment

Test monitoring stack for the SvelteKit app.

## Usage

```bash
$ mise run up
```

Open Grafana: <http://localhost:3001> (`admin` / `admin123`)

Check scrape targets: <http://localhost:8428/targets>

### Dev target

In [`../`](../), run:

```bash
$ pnpm run dev
```

`server.host: "0.0.0.0"` in `vite.config.js` is set so VictoriaMetrics can scrape `/-/metrics`.

Dev dashboard in Grafana: **SvelteKit App Metrics Dev**

### Prod target

In [`../`](../), build and run the production server:

```bash
$ mise run preview-prod-build
```

Prod dashboard in Grafana: **SvelteKit App Metrics Prod**

## Scrape targets

| Job                  | Endpoint                        |
| -------------------- | ------------------------------- |
| `sveltekit-app-dev`  | `host.containers.internal:5173` |
| `sveltekit-app-prod` | `host.containers.internal:3000` |

## Teardown

```bash
$ mise run teardown
```
