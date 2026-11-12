<script>
    import { SvelteURLSearchParams } from "svelte/reactivity";
    import { m } from "#lib/paraglide/messages.js";
    import { getLocale } from "#lib/paraglide/runtime.js";

    let { data } = $props();

    const presetLabels = {
        today: m.mcp_log_preset_today,
        yesterday: m.mcp_log_preset_yesterday,
        last_7_days: m.mcp_log_preset_last_7_days,
        last_30_days: m.mcp_log_preset_last_30_days,
        this_month: m.mcp_log_preset_this_month,
        all_time: m.mcp_log_preset_all_time,
    };

    const dateFormatter = new Intl.DateTimeFormat(getLocale(), {
        timeZone: "Europe/Paris",
        dateStyle: "short",
        timeStyle: "short",
    });

    const compactDateFormatter = new Intl.DateTimeFormat(getLocale(), {
        timeZone: "Europe/Paris",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

    function fmtTime(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
    }

    function fmtCompactTime(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : compactDateFormatter.format(date);
    }

    function formatUsd(value) {
        if (!value) return "$0";

        return value < 0.000001 ? "< $0.000001" : `$${value.toFixed(6)}`;
    }

    function embeddingSummary(row) {
        const calls = row.vectorize_calls ?? 0;
        const cache = row.vectorize_cache_hits ?? 0;

        if (calls === 0 && cache === 0) return "—";

        return m.mcp_log_embedding_summary({
            calls,
            cache,
            tokens: row.embedding_tokens ?? 0,
            cost: formatUsd(row.embedding_cost_usd ?? 0),
        });
    }

    function formatArguments(row) {
        const args = row.tool_arguments ?? {};
        const parts = [];

        if (args.authors != null) {
            parts.push(`authors=${Array.isArray(args.authors) ? args.authors.join(", ") : args.authors}`);
        }
        if (args.title != null) parts.push(`title=${args.title}`);
        if (args.limit != null) parts.push(`limit=${args.limit}`);
        if (args.page != null && args.page !== 1) parts.push(`page=${args.page}`);
        if (args.maxCharacters != null) parts.push(`maxCharacters=${args.maxCharacters}`);

        return parts.length > 0 ? parts.join(" · ") : "—";
    }

    function hasArguments(row) {
        return row.tool_arguments != null && Object.keys(row.tool_arguments).length > 0;
    }

    function argumentsJson(row) {
        return JSON.stringify(row.tool_arguments ?? {}, null, 2);
    }

    function formatResults(row) {
        if (row.result_count == null) return "—";

        if (row.tool_name === "semanticSearch" && row.result_total != null) {
            return m.mcp_log_results_page({ count: row.result_count, total: row.result_total });
        }

        return m.mcp_log_results_rows({ count: row.result_count });
    }

    function resultMetaTitle(row) {
        const meta = row.result_meta ?? {};
        const parts = [];

        if (meta.total_pages != null) parts.push(`pages=${meta.total_pages}`);
        if (meta.semantic_source) parts.push(`source=${meta.semantic_source}`);
        if (meta.semantic_error) parts.push(`error=${meta.semantic_error}`);
        if (meta.warning) parts.push(`warning=${meta.warning}`);

        return parts.join(" · ");
    }

    function isHybrid(row) {
        return row.result_meta?.hybrid === true;
    }

    function semanticFallback(row) {
        return row.result_meta?.semantic_error ?? null;
    }

    let allOpen = $state(false);

    function toggleAll() {
        allOpen = !allOpen;

        document.querySelectorAll("details.mcp-log-entry").forEach((element) => {
            element.open = allOpen;
        });
    }

    function pagerUrl(page) {
        const params = new SvelteURLSearchParams();

        if (data.all) {
            params.set("all", "1");
        } else {
            if (data.from) params.set("from", data.from);
            if (data.to) params.set("to", data.to);
        }

        params.set("page", String(page));

        return `?${params.toString()}`;
    }
</script>

<svelte:head>
    <title>{m.mcp_log_title()}</title>
</svelte:head>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-1 tracking-tight">{m.mcp_log_title()}</h1>
    <p class="mb-6 text-sm text-gray-500">
        {m.mcp_log_subtitle()}
        <span class="text-gray-300">·</span>
        <a
            href="/mcp/"
            class="text-blue-600 hover:underline">{m.mcp_page_title()}</a
        >
    </p>

    <div class="mb-3 text-sm flex flex-wrap items-center gap-2 text-gray-600">
        <span class="font-semibold text-gray-700">{m.mcp_log_range()}</span>
        {#each data.presets as preset (preset.key)}
            <a
                href={preset.href}
                class="text-blue-600 hover:underline">{presetLabels[preset.key]()}</a
            >
            <span class="text-gray-300">·</span>
        {/each}
    </div>

    <form
        method="GET"
        action="/mcp/log/"
        class="mb-6 flex flex-wrap items-center gap-2 text-sm"
    >
        <label
            for="from"
            class="text-gray-600">{m.mcp_log_from()}</label
        >
        <input
            type="date"
            id="from"
            name="from"
            value={data.from ?? ""}
            class="px-2 py-1 border border-gray-300 rounded-sm text-sm"
        />
        <label
            for="to"
            class="text-gray-600">{m.mcp_log_to()}</label
        >
        <input
            type="date"
            id="to"
            name="to"
            value={data.to ?? ""}
            class="px-2 py-1 border border-gray-300 rounded-sm text-sm"
        />
        <button
            type="submit"
            class="px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded-sm text-sm font-semibold cursor-pointer hover:bg-blue-700"
        >
            {m.mcp_log_apply()}
        </button>
    </form>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-gray-600">
            {m.mcp_log_totals({
                logs: data.total,
                calls: data.totals.vectorizeCalls,
                tokens: data.totals.embeddingTokens,
                cost: formatUsd(data.totals.embeddingCostUsd),
            })}
        </p>
        {#if data.rows.length > 0}
            <button
                type="button"
                class="text-xs text-blue-600 hover:underline cursor-pointer"
                onclick={toggleAll}
            >
                {allOpen ? m.mcp_log_collapse_all() : m.mcp_log_expand_all()}
            </button>
        {/if}
    </div>

    {#if data.rows.length === 0}
        <p class="text-sm text-gray-500 italic">{m.mcp_log_empty()}</p>
    {:else}
        <div class="border border-gray-200 rounded-sm bg-white overflow-hidden">
            <div
                class="mcp-log-header mcp-log-grid"
                aria-hidden="true"
            >
                <span>{m.mcp_log_col_date()}</span>
                <span>{m.mcp_log_col_call()}</span>
                <span class="mcp-log-count">{m.mcp_log_col_results()}</span>
                <span class="mcp-log-duration">{m.mcp_log_col_duration()}</span>
                <span class="mcp-log-tool">{m.mcp_log_col_tool()}</span>
                <span class="mcp-log-status">{m.mcp_log_col_status()}</span>
            </div>
            {#each data.rows as row (row.id)}
                <details class="mcp-log-entry">
                    <summary>
                        <span class="mcp-log-summary mcp-log-grid">
                            <span
                                class="mcp-log-when"
                                title={fmtTime(row.created_at)}>{fmtCompactTime(row.created_at)}</span
                            >
                            <span class="mcp-log-content">
                                <span
                                    class="mcp-log-chevron"
                                    aria-hidden="true">▸</span
                                >
                                <span
                                    class="mcp-log-purpose"
                                    title={row.purpose ?? ""}>{row.purpose ?? "—"}</span
                                >
                            </span>
                            <span class="mcp-log-count">
                                <span>{formatResults(row)}</span>
                                {#if isHybrid(row)}
                                    <span
                                        class="inline-block px-1.5 py-0.5 text-xs font-semibold rounded-sm bg-blue-100 text-blue-700"
                                        >{m.mcp_log_hybrid()}</span
                                    >
                                {/if}
                                {#if semanticFallback(row)}
                                    <span
                                        class="inline-block px-1.5 py-0.5 text-xs font-semibold rounded-sm bg-amber-100 text-amber-700"
                                        title={semanticFallback(row)}>{m.mcp_log_bm25_only()}</span
                                    >
                                {/if}
                            </span>
                            <span class="mcp-log-duration"
                                >{row.duration_ms != null ? `${row.duration_ms} ms` : "—"}</span
                            >
                            <span class="mcp-log-tool">
                                <span class="font-mono text-xs text-gray-700 whitespace-nowrap">{row.tool_name}</span>
                            </span>
                            <span class="mcp-log-status">
                                {#if row.truncated}
                                    <span
                                        class="inline-block px-1.5 py-0.5 text-xs font-semibold rounded-sm bg-amber-100 text-amber-700"
                                        title={m.mcp_log_truncated()}>{m.mcp_log_truncated()}</span
                                    >
                                {/if}
                                <span
                                    class="inline-block px-1.5 py-0.5 text-xs font-semibold rounded-sm
                                    {row.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}"
                                    title={row.error_stage ? m.mcp_log_error_stage({ stage: row.error_stage }) : ""}
                                    >{row.success ? m.mcp_log_status_ok() : m.mcp_log_status_error()}</span
                                >
                            </span>
                        </span>
                    </summary>

                    <div class="mcp-log-detail">
                        <dl class="mcp-log-detail-grid">
                            <dt>{m.mcp_log_col_purpose()}</dt>
                            <dd>{row.purpose ?? "—"}</dd>

                            <dt>{m.mcp_log_col_query()}</dt>
                            <dd>
                                <pre
                                    class="mcp-log-query"
                                    class:natural={row.tool_name === "semanticSearch"}>{row.query}</pre>
                            </dd>

                            <dt>{m.mcp_log_col_arguments()}</dt>
                            <dd>
                                {formatArguments(row)}
                                {#if hasArguments(row)}
                                    <details class="mt-1">
                                        <summary class="cursor-pointer text-xs text-blue-600 hover:underline"
                                            >JSON</summary
                                        >
                                        <pre class="mcp-log-json">{argumentsJson(row)}</pre>
                                    </details>
                                {/if}
                            </dd>

                            <dt>{m.mcp_log_col_results()}</dt>
                            <dd title={resultMetaTitle(row)}>
                                {formatResults(row)}
                                {#if isHybrid(row)}
                                    <span
                                        class="ml-1 inline-block px-1.5 py-0.5 text-xs font-semibold rounded-sm bg-blue-100 text-blue-700"
                                        >{m.mcp_log_hybrid()}</span
                                    >
                                {/if}
                                {#if semanticFallback(row)}
                                    <span
                                        class="ml-1 inline-block px-1.5 py-0.5 text-xs font-semibold rounded-sm bg-amber-100 text-amber-700"
                                        title={semanticFallback(row)}>{m.mcp_log_bm25_only()}</span
                                    >
                                {/if}
                            </dd>

                            <dt>{m.mcp_log_col_embedding()}</dt>
                            <dd
                                title={row.embedding_model
                                    ? `${row.embedding_model}${row.embedding_ms != null ? ` · ${row.embedding_ms} ms` : ""}`
                                    : ""}
                            >
                                {embeddingSummary(row)}
                            </dd>

                            {#if row.error_stage}
                                <dt>{m.mcp_log_col_status()}</dt>
                                <dd>{m.mcp_log_error_stage({ stage: row.error_stage })}</dd>
                            {/if}
                        </dl>

                        <p class="mcp-log-footer">
                            <span>
                                <span class="text-gray-400">{m.mcp_log_col_client()}:</span>
                                {row.client_name ?? "—"}
                                {#if row.client_version}<span class="text-gray-400">· {row.client_version}</span>{/if}
                            </span>
                            <span>
                                <span
                                    class="text-gray-400"
                                    title={m.mcp_log_session_hint()}>{m.mcp_log_col_session()}:</span
                                >
                                {#if row.client_session_id}
                                    <span class="font-mono break-all">{row.client_session_id}</span>
                                {:else}
                                    —
                                {/if}
                            </span>
                            <span>
                                <span class="text-gray-400">{m.mcp_log_col_ip()}:</span>
                                <span class="font-mono">{row.ip ?? "—"}</span>
                            </span>
                            <span title={row.token_id ?? ""}>
                                <span class="text-gray-400">{m.mcp_log_col_token()}:</span>
                                {row.token_name ?? "—"}
                            </span>
                        </p>
                    </div>
                </details>
            {/each}
        </div>

        {#if data.pageCount > 1}
            <nav class="mt-5 text-sm flex items-center gap-2 text-gray-600">
                <a
                    href={pagerUrl(1)}
                    class="text-blue-600 hover:underline">{m.mcp_log_first()}</a
                >
                <a
                    href={pagerUrl(Math.max(1, data.page - 1))}
                    class="text-blue-600 hover:underline">{m.mcp_log_prev()}</a
                >
                <span>{m.mcp_log_page({ page: data.page, count: data.pageCount })}</span>
                <a
                    href={pagerUrl(Math.min(data.pageCount, data.page + 1))}
                    class="text-blue-600 hover:underline">{m.mcp_log_next()}</a
                >
                <a
                    href={pagerUrl(data.pageCount)}
                    class="text-blue-600 hover:underline">{m.mcp_log_last()}</a
                >
            </nav>
        {/if}
    {/if}
</main>

<style>
    .mcp-log-entry {
        border-bottom: 1px solid #e5e7eb;
    }

    .mcp-log-entry:last-child {
        border-bottom: 0;
    }

    .mcp-log-entry > summary {
        list-style: none;
        cursor: pointer;
        padding: 0.625rem 0.75rem;
    }

    .mcp-log-entry > summary::-webkit-details-marker {
        display: none;
    }

    .mcp-log-entry[open] > summary {
        background: #f9fafb;
    }

    .mcp-log-header {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        color: #6b7280;
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    .mcp-log-grid {
        display: grid;
        grid-template-columns: 5.25rem minmax(0, 1fr) 5rem 3.5rem 8rem 4rem;
        gap: 0.75rem;
        align-items: start;
    }

    .mcp-log-when {
        color: #6b7280;
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .mcp-log-content {
        display: flex;
        align-items: flex-start;
        gap: 0.375rem;
        min-width: 0;
    }

    .mcp-log-purpose {
        display: -webkit-box;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        font-weight: 400;
        color: #1f2937;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
    }

    .mcp-log-count,
    .mcp-log-duration {
        color: #6b7280;
        font-size: 0.75rem;
        text-align: right;
        white-space: nowrap;
    }

    .mcp-log-count {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.125rem;
    }

    .mcp-log-tool {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        min-width: 0;
    }

    .mcp-log-status {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.125rem;
    }

    .mcp-log-chevron {
        flex: 0 0 auto;
        margin-top: 0.1rem;
        color: #6b7280;
        transition:
            color 150ms ease,
            transform 150ms ease;
    }

    .mcp-log-entry > summary:hover .mcp-log-chevron {
        color: #374151;
    }

    .mcp-log-entry[open] .mcp-log-chevron {
        transform: rotate(90deg);
    }

    .mcp-log-detail {
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
        padding: 0.625rem 0.75rem 0.75rem;
    }

    .mcp-log-detail-grid {
        display: grid;
        gap: 0.5rem 0.75rem;
        margin: 0;
    }

    .mcp-log-detail-grid dt {
        font-size: 0.75rem;
        color: #6b7280;
    }

    .mcp-log-detail-grid dd {
        margin: 0;
        min-width: 0;
        font-size: 0.875rem;
        color: #1f2937;
    }

    .mcp-log-query,
    .mcp-log-json {
        margin: 0;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
        border: 1px solid #e5e7eb;
        border-radius: 0.125rem;
        background: #ffffff;
        padding: 0.5rem 0.625rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.75rem;
        color: #1f2937;
    }

    .mcp-log-query.natural {
        font-family: inherit;
        font-size: 0.8125rem;
    }

    .mcp-log-json {
        margin-top: 0.25rem;
        max-height: 16rem;
        overflow: auto;
        background: #f9fafb;
    }

    .mcp-log-footer {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 0.75rem;
        margin: 0.5rem 0 0;
        padding-top: 0.5rem;
        border-top: 1px solid #e5e7eb;
        font-size: 0.75rem;
        color: #6b7280;
    }

    @media (min-width: 640px) {
        .mcp-log-detail-grid {
            grid-template-columns: 6.5rem minmax(0, 1fr);
        }
    }

    @media (max-width: 639px) {
        .mcp-log-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem 0.75rem;
        }

        .mcp-log-header {
            display: none;
        }

        .mcp-log-when {
            order: 1;
        }

        .mcp-log-count {
            order: 2;
            margin-left: auto;
        }

        .mcp-log-duration {
            order: 3;
        }

        .mcp-log-tool {
            order: 4;
        }

        .mcp-log-status {
            order: 5;
        }

        .mcp-log-content {
            flex-basis: 100%;
            order: 6;
        }
    }
</style>
