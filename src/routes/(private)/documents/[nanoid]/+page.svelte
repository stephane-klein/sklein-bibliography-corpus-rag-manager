<script>
    import { m } from "#lib/paraglide/messages.js";
    import { getLocale } from "#lib/paraglide/runtime.js";

    let { data } = $props();

    const navigation = $derived(data.navigation);

    function formatNumber(value) {
        return new Intl.NumberFormat(getLocale()).format(value);
    }

    function documentTitle() {
        const book = navigation ? ` — ${navigation.book.title}` : "";

        return `${data.contentNode.title}${book} — ${m.app_name()}`;
    }

    // The band stands in for the metadata list on a nested page, so it shows
    // the same bibliographic facts without the empty placeholders.
    function bookMetaParts() {
        return [
            data.contentNode.authors.join(", "),
            data.contentNode.original_published_date,
            data.contentNode.source_url === null ? (data.contentNode.source_kind?.toUpperCase() ?? null) : null,
        ].filter((part) => part);
    }

    function readyHint() {
        return m.documents_outline_ready_hint({ model: data.embeddingModel });
    }

    function staleHint() {
        return m.documents_outline_stale_hint({ model: data.embeddingModel });
    }
</script>

<svelte:head>
    <title>{documentTitle()}</title>
</svelte:head>

{#snippet stateCell(node)}
    {#if node.state === "ready"}
        <span
            class="font-semibold text-green-600"
            title={readyHint()}>✓</span
        >
    {:else if node.state === "none"}
        <span
            class="inline-block rounded-sm border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700"
            title={m.documents_outline_none_hint()}>{m.documents_outline_none()}</span
        >
    {:else if node.state === "stale"}
        <span
            class="inline-block rounded-sm border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700"
            title={staleHint()}>{m.documents_outline_stale()}</span
        >
    {:else if node.state === "partial"}
        <span
            class="inline-block rounded-sm border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600"
            title={m.documents_outline_partial_hint({ model: data.embeddingModel })}
            >{m.documents_outline_partial()}</span
        >
    {:else if node.state === "pending"}
        <span
            class="inline-block rounded-sm border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600"
            >{m.documents_outline_pending()}</span
        >
    {/if}
{/snippet}

{#snippet outlineRows(nodes, depth)}
    {#each nodes as node (node.id)}
        <tr class="border-b border-gray-200 hover:bg-gray-100">
            <th
                scope="row"
                class="py-1.5 pr-2 text-left align-top font-normal"
                style={`padding-left: ${1.25 + depth * 1.25}rem`}
            >
                <a
                    href="/documents/{node.nanoid}/"
                    class="text-blue-600 no-underline hover:underline">{node.title}</a
                >
            </th>
            <td class="py-1.5 pr-2 text-right tabular-nums whitespace-nowrap align-top text-gray-700"
                >{formatNumber(node.tokens)}</td
            >
            <td class="py-1.5 pr-2 text-center align-top whitespace-nowrap">{@render stateCell(node)}</td>
        </tr>
        {@render outlineRows(node.children, depth + 1)}
    {/each}
{/snippet}

{#snippet bookBand()}
    <div class="mt-4 rounded-sm border border-gray-200 bg-gray-50 px-4 py-3">
        <p class="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            {m.documents_book_label()}
        </p>
        <p class="mt-1">
            <a
                href="/documents/{navigation.book.nanoid}/"
                class="book-band-title font-semibold text-gray-900 no-underline hover:underline"
                title={navigation.book.title}>{navigation.book.title}</a
            >
        </p>
        {#if bookMetaParts().length > 0}
            <p class="mt-1 text-sm text-gray-500">{bookMetaParts().join(" · ")}</p>
        {/if}
        {#if data.contentNode.source_url}
            <p class="mt-1 text-sm">
                <a
                    href={data.contentNode.source_url}
                    class="text-blue-600 break-all no-underline hover:underline">{data.contentNode.source_url}</a
                >
            </p>
        {/if}
        {#if navigation.ancestors.length > 0}
            <nav
                class="mt-1 text-sm"
                aria-label={m.documents_breadcrumb_label()}
            >
                <ol class="flex flex-wrap items-center gap-x-2 text-gray-500">
                    {#each navigation.ancestors as ancestor, index (ancestor.id)}
                        <li class="flex items-center gap-x-2">
                            {#if index > 0}
                                <span
                                    class="text-gray-400"
                                    aria-hidden="true">›</span
                                >
                            {/if}
                            <a
                                href="/documents/{ancestor.nanoid}/"
                                class="text-gray-600 no-underline hover:text-blue-600 hover:underline"
                                >{ancestor.title}</a
                            >
                        </li>
                    {/each}
                </ol>
            </nav>
        {/if}
    </div>
{/snippet}

{#snippet bookPager(extraClass)}
    <nav
        class={extraClass}
        aria-label={m.documents_nav_label()}
    >
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {#if navigation.previous}
                <a
                    href="/documents/{navigation.previous.nanoid}/"
                    rel="prev"
                    class="book-pager-card"
                    aria-label={m.documents_nav_previous_aria({ title: navigation.previous.title })}
                >
                    <span class="book-pager-label">← {m.documents_nav_previous()}</span>
                    <span class="book-pager-title">{navigation.previous.title}</span>
                </a>
            {:else}
                <span class="book-pager-empty">← {m.documents_nav_start()}</span>
            {/if}

            {#if navigation.parent}
                <a
                    href="/documents/{navigation.parent.nanoid}/"
                    class="book-pager-card"
                    aria-label={m.documents_nav_parent_aria({ title: navigation.parent.title })}
                >
                    <span class="book-pager-label">↑ {m.documents_nav_parent()}</span>
                    <span class="book-pager-title">{navigation.parent.title}</span>
                </a>
            {/if}

            {#if navigation.next}
                <a
                    href="/documents/{navigation.next.nanoid}/"
                    rel="next"
                    class="book-pager-card"
                    aria-label={m.documents_nav_next_aria({ title: navigation.next.title })}
                >
                    <span class="book-pager-label">{m.documents_nav_next()} →</span>
                    <span class="book-pager-title">{navigation.next.title}</span>
                </a>
            {:else}
                <span class="book-pager-empty">{m.documents_nav_end()} →</span>
            {/if}
        </div>
    </nav>
{/snippet}

<main class="page px-5 pt-7 pb-16">
    <div class="mx-auto max-w-[46rem]">
        <a
            href="/documents"
            class="text-sm text-blue-600 no-underline hover:underline">{m.documents_back()}</a
        >

        {#if navigation}
            {@render bookBand()}
        {/if}

        <h1 class="text-xl font-bold mt-4 mb-5">{data.contentNode.title}</h1>

        {#if navigation}
            {@render bookPager("mt-5 mb-8")}
        {:else}
            <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm mb-8">
                <dt class="text-gray-500">{m.documents_column_authors()}</dt>
                <dd>{data.contentNode.authors.length > 0 ? data.contentNode.authors.join(", ") : "—"}</dd>

                <dt class="text-gray-500">{m.documents_column_original_date()}</dt>
                <dd>{data.contentNode.original_published_date ?? "—"}</dd>

                <dt class="text-gray-500">{m.documents_detail_source_label()}</dt>
                <dd>
                    {#if data.contentNode.source_url}
                        <a
                            href={data.contentNode.source_url}
                            class="text-blue-600 break-all no-underline hover:underline"
                            >{data.contentNode.source_url}</a
                        >
                    {:else if data.contentNode.source_kind === "epub"}
                        <span
                            class="inline-block rounded-sm border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                            >{m.documents_source_epub()}</span
                        >
                    {:else}
                        —
                    {/if}
                </dd>
            </dl>
        {/if}

        {#if data.outline}
            <h2 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                {m.documents_outline_title()}
                <span class="ml-2 font-normal normal-case tracking-normal text-gray-500">
                    {m.documents_outline_summary({
                        sections: formatNumber(data.outline.sectionCount),
                        tokens: formatNumber(data.outline.totalTokens),
                    })}
                </span>
            </h2>

            {#if data.outline.children.length === 0}
                <p class="text-sm text-gray-500 italic">{m.documents_outline_empty()}</p>
            {:else}
                <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                        <colgroup>
                            <col />
                            <col class="w-28" />
                            <col class="w-24" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th
                                    scope="col"
                                    class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                                    >{m.documents_column_title()}</th
                                >
                                <th
                                    scope="col"
                                    class="text-right text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                                    >{m.documents_outline_tokens()}</th
                                >
                                <th
                                    scope="col"
                                    class="text-center text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                                    >{m.documents_outline_vectorized()}</th
                                >
                            </tr>
                        </thead>
                        {#each data.outline.children as group (group.id)}
                            <tbody>
                                <tr class="bg-blue-50 border-b border-gray-200">
                                    <th
                                        scope={group.children.length > 0 ? "rowgroup" : "row"}
                                        class="py-2 pr-2 text-left align-top font-semibold text-gray-900"
                                    >
                                        {#if group.isFile}
                                            <a
                                                href="/documents/{group.nanoid}/"
                                                class="no-underline text-inherit hover:underline">{group.title}</a
                                            >
                                        {:else}
                                            {group.title}
                                        {/if}
                                    </th>
                                    <td
                                        class="py-2 pr-2 text-right tabular-nums whitespace-nowrap align-top font-semibold text-gray-700"
                                        >{formatNumber(group.totalTokens)}</td
                                    >
                                    <td class="py-2 pr-2 text-center align-top whitespace-nowrap">
                                        {@render stateCell(group)}
                                    </td>
                                </tr>
                                {@render outlineRows(group.children, 1)}
                            </tbody>
                        {/each}
                    </table>
                </div>
            {/if}
        {:else}
            <h2 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                {m.documents_detail_content()}
            </h2>
            <article class="markdown-body">
                <!-- The HTML comes from renderMarkdown, where raw HTML is escaped. -->
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html data.contentHtml}
            </article>
        {/if}

        {#if navigation}
            {@render bookPager("mt-10")}
        {/if}
    </div>
</main>

<style>
    .markdown-body {
        font-size: 1.0625rem;
        line-height: 1.7;
        color: #1f2937;
        overflow-wrap: break-word;
    }

    .markdown-body :global(p) {
        margin: 0 0 1.15em;
    }

    .markdown-body :global(h2) {
        font-size: 1.3rem;
        font-weight: 700;
        line-height: 1.3;
        margin: 2.2em 0 0.7em;
    }

    .markdown-body :global(h3) {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 1.8em 0 0.6em;
    }

    .markdown-body :global(h4),
    .markdown-body :global(h5),
    .markdown-body :global(h6) {
        font-size: 1rem;
        font-weight: 600;
        margin: 1.6em 0 0.5em;
    }

    .markdown-body :global(a) {
        color: #2563eb;
        text-decoration: none;
    }

    .markdown-body :global(a:hover) {
        text-decoration: underline;
    }

    /* Page number of the original edition: kept visible, no longer a link. */
    .markdown-body :global(a.page-ref),
    .markdown-body :global(a.page-ref:hover) {
        color: inherit;
        text-decoration: none;
        font-variant-numeric: tabular-nums;
    }

    .markdown-body :global(ul),
    .markdown-body :global(ol) {
        margin: 0 0 1.15em;
        padding-left: 1.5em;
    }

    .markdown-body :global(li) {
        margin: 0.35em 0;
    }

    .markdown-body :global(blockquote) {
        margin: 1.5em 0;
        padding-left: 1em;
        border-left: 3px solid #e5e7eb;
        color: #4b5563;
    }

    .markdown-body :global(hr) {
        border: 0;
        border-top: 1px solid #e5e7eb;
        margin: 2em 0;
    }

    .markdown-body :global(img) {
        max-width: 100%;
        height: auto;
    }

    .markdown-body :global(.table-wrap) {
        margin: 1.5em 0;
        overflow-x: auto;
    }

    .markdown-body :global(table) {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .markdown-body :global(th),
    .markdown-body :global(td) {
        padding: 0.4em 0.7em;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
        vertical-align: top;
    }

    .markdown-body :global(th) {
        font-weight: 600;
        background: #f9fafb;
    }

    .markdown-body :global(td) {
        font-variant-numeric: tabular-nums;
    }

    .markdown-body :global(.footnotes) {
        margin-top: 2.5em;
        font-size: 0.875rem;
        line-height: 1.6;
        color: #4b5563;
    }

    .markdown-body :global(.footnotes-sep) {
        border: 0;
        border-top: 1px solid #e5e7eb;
        margin: 2.5em 0 1em;
    }

    .markdown-body :global(.footnote-ref) {
        font-size: 0.75em;
        line-height: 0;
    }

    .markdown-body :global(.footnote-ref a) {
        padding: 0 0.15em;
    }

    .markdown-body :global(.footnote-backref) {
        margin-left: 0.3em;
        text-decoration: none;
    }

    .book-band-title {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .book-pager-card,
    .book-pager-empty {
        display: block;
        min-height: 3.5rem;
        padding: 0.5rem 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 3px;
        text-decoration: none;
    }

    .book-pager-card:hover {
        border-color: #bfdbfe;
        background: #eff6ff;
    }

    .book-pager-card:focus-visible {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
    }

    .book-pager-label {
        display: block;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #6b7280;
    }

    .book-pager-title {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-top: 0.15rem;
        font-size: 0.875rem;
        font-weight: 600;
        line-height: 1.35;
        color: #111827;
    }

    .book-pager-empty {
        border-style: dashed;
        font-size: 0.875rem;
        color: #9ca3af;
    }
</style>
