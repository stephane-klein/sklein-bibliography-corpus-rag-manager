<script>
    import { writable } from "svelte/store";
    import { onMount, onDestroy, tick } from "svelte";
    import { beforeNavigate, afterNavigate } from "$app/navigation";
    import { browser } from "$app/env";
    import { PUBLIC_BUILD_STAMP, PUBLIC_REPO_URL, PUBLIC_GIT_HASH } from "$app/env/public";

    const pageMetrics = writable({ ssr: null, csr: null });

    let open = $state(false);
    let navStart = 0;
    let navTotalMs = null;
    let latestDataEntry = null;
    let observer;
    let popupEl = $state(null);

    function ms(v) {
        if (v == null) return "\u2014";
        return v.toFixed(1);
    }

    function formatSize(bytes) {
        if (bytes == null) return "\u2014";
        if (bytes === 0) return "from browser cache";
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    function requestMetrics(entry, prefix) {
        const st = entry.serverTiming;
        if (!st?.length) return null;

        const get = (suffix) => st.find((s) => s.name === `${prefix}-${suffix}`)?.duration ?? 0;
        const processingMs = get("processing");
        const requestMs = entry.responseEnd - entry.requestStart;

        return {
            sqlQueryCount: get("pgcount"),
            sqlQueryMs: get("pgtime"),
            processingMs,
            // requestMs includes the server processing, so subtract it to keep
            // the three displayed durations additive and non-overlapping.
            networkMs: Math.max(0, requestMs - processingMs),
            totalMs: requestMs,
            transferSize: entry.transferSize,
            decodedBodySize: entry.decodedBodySize,
        };
    }

    function initNavigationMetrics() {
        const nav = performance.getEntriesByType("navigation")[0];
        if (!nav) return;

        const ssr = requestMetrics(nav, "ssr");
        if (!ssr) return;

        pageMetrics.set({
            ssr: { ...ssr, clientStartupMs: performance.now() - nav.responseEnd },
            csr: null,
        });
    }

    function applyCsr(entry, totalMs = null) {
        const csr = requestMetrics(entry, "csr");
        if (!csr) return;

        pageMetrics.update((m) => ({
            ...m,
            csr: {
                ...csr,
                // Wall time minus the data request leaves only the client render.
                clientRenderMs: totalMs === null ? null : Math.max(0, totalMs - csr.totalMs),
                totalMs: totalMs ?? csr.totalMs,
            },
        }));
    }

    function initCsrObserver() {
        const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.name.includes("__data.json")) continue;
                if (navStart && entry.responseEnd < navStart) continue;
                latestDataEntry = entry;
                applyCsr(entry, navTotalMs);
            }
        });
        obs.observe({ entryTypes: ["resource"] });
        return obs;
    }

    onMount(() => {
        if (!browser) return;
        // Vite serves one module per request in development, so the default
        // 250-entry resource timing buffer fills up quickly.
        performance.setResourceTimingBufferSize(1000);
        initNavigationMetrics();
        observer = initCsrObserver();
        document.addEventListener("click", handleClickOutside);
    });

    onDestroy(() => {
        observer?.disconnect();
        if (!browser) return;
        document.removeEventListener("click", handleClickOutside);
    });

    function handleClickOutside(event) {
        if (!popupEl || !open) return;
        if (popupEl.contains(event.target)) return;
        if (event.target.closest(".trigger")) return;
        open = false;
    }

    beforeNavigate(({ shallow, type }) => {
        if (shallow && type === "goto") return;

        performance.mark("nav-start");
        navStart = performance.now();
        navTotalMs = null;
    });

    afterNavigate(async ({ shallow, type }) => {
        if (shallow && type === "goto") return;
        if (!navStart) return;

        performance.mark("nav-end");
        performance.measure("CSR Navigation", "nav-start", "nav-end");

        await tick();
        await new Promise((r) => setTimeout(r, 0));

        navTotalMs = performance.now() - navStart;

        // The resource timing entry may already be recorded, or it may arrive
        // later through the observer. Apply the wall time now if it is known.
        const entry =
            performance
                .getEntriesByType("resource")
                .filter((e) => e.name.includes("__data.json") && e.responseEnd >= navStart)
                .at(-1) ?? (latestDataEntry?.responseEnd >= navStart ? latestDataEntry : null);

        if (!entry) return;
        applyCsr(entry, navTotalMs);
    });
</script>

<button
    class="trigger"
    onclick={() => (open = !open)}>tech info</button
>

{#if open}
    <div
        class="popup"
        bind:this={popupEl}
    >
        <button
            class="close"
            onclick={() => (open = false)}>✕</button
        >

        <div class="version">
            <div>
                Built at
                <span class="val">{PUBLIC_BUILD_STAMP ?? "—"}</span>
            </div>

            <div>
                GitHub SHA1 version :

                <a
                    href="{PUBLIC_REPO_URL}/commit/{PUBLIC_GIT_HASH}"
                    target="_blank"
                    rel="external"><span class="val">{PUBLIC_GIT_HASH?.slice(0, 7) ?? "—"}</span></a
                >
            </div>
        </div>

        {#if $pageMetrics.ssr}
            <div class="section">
                <div class="section-title">
                    <a
                        href="https://svelte.dev/docs/kit/glossary#SSR"
                        target="_blank"
                        rel="external">SSR</a
                    >
                    <span class="desc">— first full page load</span>
                </div>
                <div class="row">
                    total: <span class="val">{ms($pageMetrics.ssr.totalMs)}ms</span> = server + network (page visible)
                </div>
                <div class="row child">
                    server processing in SvelteKit (load functions, hooks): <span class="val"
                        >{ms($pageMetrics.ssr.processingMs)}ms</span
                    >
                </div>
                <div class="row grandchild">
                    <span class="val">{$pageMetrics.ssr.sqlQueryCount}</span>
                    database queries —
                    <span class="val">{ms($pageMetrics.ssr.sqlQueryMs)}ms</span>
                    total in PostgreSQL
                </div>
                <div class="row child">
                    network roundtrip to download the HTML page: <span class="val"
                        >{ms($pageMetrics.ssr.networkMs)}ms</span
                    >
                </div>
                <div class="row grandchild">
                    page weight: <span class="val">{formatSize($pageMetrics.ssr.transferSize)}</span>
                    / <span class="val">{formatSize($pageMetrics.ssr.decodedBodySize)}</span> decoded
                </div>
            </div>
            <div class="row client-startup">
                client startup: <span class="val">{ms($pageMetrics.ssr.clientStartupMs)}ms</span>
                (page already visible,
                <a
                    href="https://svelte.dev/docs/kit/glossary#Hydration"
                    target="_blank"
                    rel="external">hydration</a
                > + resource loading)
            </div>
        {:else}
            <div class="section">
                <a
                    href="https://svelte.dev/docs/kit/glossary#SSR"
                    target="_blank"
                    rel="external">SSR</a
                >: pending
            </div>
        {/if}

        {#if $pageMetrics.csr}
            <div class="section">
                <div class="section-title">
                    <a
                        href="https://svelte.dev/docs/kit/glossary#CSR"
                        target="_blank"
                        rel="external">CSR</a
                    >
                    <span class="desc">— last rendering after client navigation</span>
                </div>
                <div class="row">
                    total: <span class="val">{ms($pageMetrics.csr.totalMs)}ms</span> = server + network + client rendering
                </div>
                <div class="row child">
                    server processing in SvelteKit (load functions, hooks): <span class="val"
                        >{ms($pageMetrics.csr.processingMs)}ms</span
                    >
                </div>
                <div class="row grandchild">
                    <span class="val">{$pageMetrics.csr.sqlQueryCount}</span>
                    database queries —
                    <span class="val">{ms($pageMetrics.csr.sqlQueryMs)}ms</span>
                    total in PostgreSQL
                </div>
                <div class="row child">
                    network roundtrip to fetch JSON data: <span class="val">{ms($pageMetrics.csr.networkMs)}ms</span>
                </div>
                <div class="row grandchild">
                    page weight: <span class="val">{formatSize($pageMetrics.csr.transferSize)}</span>
                    / <span class="val">{formatSize($pageMetrics.csr.decodedBodySize)}</span> decoded
                </div>
                <div class="row child-last">
                    client rendering: <span class="val">{ms($pageMetrics.csr.clientRenderMs)}ms</span>
                </div>
            </div>
        {:else}
            <div class="section">
                <a
                    href="https://svelte.dev/docs/kit/glossary#CSR"
                    target="_blank"
                    rel="external">CSR</a
                >: none
            </div>
        {/if}
    </div>
{/if}

<style>
    .trigger {
        position: absolute;
        bottom: 0;
        right: 0;
        background: #f5f5f5;
        color: #666;
        border: 1px solid #ddd;
        font: 11px monospace;
        padding: 2px 6px;
        cursor: pointer;
        opacity: 0.7;
        white-space: nowrap;
    }

    .trigger:hover {
        opacity: 1;
    }

    .popup {
        position: absolute;
        bottom: 28px;
        right: 8px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        padding: 12px 16px;
        font: 11px monospace;
        color: #666;
        min-width: 320px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .close {
        position: absolute;
        top: 4px;
        right: 6px;
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        font: 11px monospace;
        opacity: 0.5;
        padding: 0;
    }

    .close:hover {
        opacity: 1;
    }

    .section {
        margin-top: 8px;
    }

    .section:first-child {
        margin-top: 0;
    }

    .section-title {
        margin-bottom: 4px;
    }

    .popup a {
        color: inherit;
        text-decoration: underline;
        text-decoration-style: dotted;
        text-underline-offset: 2px;
    }

    .section-title a {
        color: #444;
    }

    .row {
        white-space: nowrap;
    }

    .row.child {
        padding-left: 14px;
    }

    .row.child-last {
        padding-left: 14px;
    }

    .row.grandchild {
        padding-left: 28px;
    }

    .val {
        font-weight: 700;
    }

    .desc {
        color: #888;
        font-style: italic;
        font-weight: 400;
    }

    .row.client-startup {
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px dotted #ddd;
    }

    .version {
        margin-bottom: 6px;
        line-height: 1.8;
    }
</style>
