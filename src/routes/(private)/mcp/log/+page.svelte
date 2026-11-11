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

    function fmtTime(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
    }

    function shortQuery(query) {
        return query.length > 120 ? `${query.slice(0, 120)}…` : query;
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

    <p class="mb-4 text-sm text-gray-600">
        {m.mcp_log_totals({
            logs: data.total,
            calls: data.totals.vectorizeCalls,
            tokens: data.totals.embeddingTokens,
            cost: formatUsd(data.totals.embeddingCostUsd),
        })}
    </p>

    {#if data.rows.length === 0}
        <p class="text-sm text-gray-500 italic">{m.mcp_log_empty()}</p>
    {:else}
        <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
                <thead>
                    <tr class="text-left text-xs uppercase tracking-wider text-gray-500 border-b-2 border-gray-300">
                        <th class="py-1.5 pr-3">{m.mcp_log_col_time()}</th>
                        <th class="py-1.5 pr-3">{m.mcp_log_col_tool()}</th>
                        <th class="py-1.5 pr-3">{m.mcp_log_col_token()}</th>
                        <th class="py-1.5 pr-3">{m.mcp_log_col_client()}</th>
                        <th class="py-1.5 pr-3">{m.mcp_log_col_ip()}</th>
                        <th class="py-1.5 pr-3">{m.mcp_log_col_purpose()}</th>
                        <th class="py-1.5 pr-3">{m.mcp_log_col_query()}</th>
                        <th class="py-1.5 pr-3">{m.mcp_log_col_embedding()}</th>
                        <th class="py-1.5 pr-3 text-right">{m.mcp_log_col_duration()}</th>
                        <th class="py-1.5 text-right">{m.mcp_log_col_status()}</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.rows as row (row.id)}
                        <tr class="border-b border-gray-200 align-top">
                            <td class="py-1.5 pr-3 whitespace-nowrap text-gray-600">{fmtTime(row.created_at)}</td>
                            <td class="py-1.5 pr-3 whitespace-nowrap font-mono text-xs text-gray-700"
                                >{row.tool_name}</td
                            >
                            <td
                                class="py-1.5 pr-3 whitespace-nowrap text-gray-600"
                                title={row.token_id ?? ""}>{row.token_name ?? "—"}</td
                            >
                            <td class="py-1.5 pr-3 whitespace-nowrap">
                                {row.client_name ?? "—"}
                                {#if row.client_version}
                                    <span class="text-gray-400">· {row.client_version}</span>
                                {/if}
                            </td>
                            <td class="py-1.5 pr-3 font-mono text-gray-600">{row.ip ?? "—"}</td>
                            <td
                                class="py-1.5 pr-3 text-gray-700 max-w-60"
                                title={row.purpose ?? ""}>{row.purpose ?? "—"}</td
                            >
                            <td class="py-1.5 pr-3">
                                <details class="max-w-120">
                                    <summary class="cursor-pointer font-mono text-xs text-gray-700 hover:text-blue-600"
                                        >{shortQuery(row.query)}</summary
                                    >
                                    <pre
                                        class="mt-2 p-2 bg-gray-100 rounded-sm font-mono text-xs whitespace-pre-wrap break-all">{row.query}</pre>
                                </details>
                            </td>
                            <td
                                class="py-1.5 pr-3 whitespace-nowrap text-gray-600"
                                title={row.embedding_model
                                    ? `${row.embedding_model}${row.embedding_ms != null ? ` · ${row.embedding_ms} ms` : ""}`
                                    : ""}
                            >
                                {embeddingSummary(row)}
                            </td>
                            <td class="py-1.5 pr-3 text-right whitespace-nowrap text-gray-600">
                                {row.duration_ms != null ? `${row.duration_ms} ms` : "—"}
                            </td>
                            <td class="py-1.5 text-right">
                                <span
                                    class="inline-block px-1.5 py-0.5 text-xs font-semibold rounded-sm
                                    {row.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}"
                                    title={row.error_stage ? m.mcp_log_error_stage({ stage: row.error_stage }) : ""}
                                    >{row.success ? m.mcp_log_status_ok() : m.mcp_log_status_error()}</span
                                >
                                {#if row.truncated}
                                    <span
                                        class="inline-block px-1.5 py-0.5 text-xs font-semibold rounded-sm bg-amber-100 text-amber-700"
                                        title={m.mcp_log_truncated()}>{m.mcp_log_truncated()}</span
                                    >
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
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
