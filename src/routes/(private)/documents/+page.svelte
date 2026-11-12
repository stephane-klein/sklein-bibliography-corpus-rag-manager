<script>
    import { m } from "#lib/paraglide/messages.js";
    import { getLocale } from "#lib/paraglide/runtime.js";

    let { data } = $props();

    // Query embeddings cost a fraction of a cent, so the table shows millionths
    // of a US dollar instead of a long run of leading zeros.
    function formatMicroUsd(costUsd) {
        return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 2 }).format(costUsd * 1_000_000);
    }

    function vectorizationLabel(state) {
        if (state === "ready") {
            return m.documents_vectorized_yes();
        }

        if (state === "partial") {
            return m.documents_vectorized_partial();
        }

        if (state === "none") {
            return "—";
        }

        return m.documents_vectorized_no();
    }

    // The hint says why a document is not available to the semantic search:
    // no vector yet, or vectors from another model.
    function vectorizationHint(state) {
        if (state === "none") {
            return m.documents_vectorized_hint_none();
        }

        if (state === "ready") {
            return m.documents_vectorized_hint_ready({ model: data.embeddingModel });
        }

        if (state === "partial") {
            return m.documents_vectorized_hint_partial({ model: data.embeddingModel });
        }

        if (state === "pending") {
            return m.documents_vectorized_hint_pending();
        }

        return m.documents_vectorized_hint_stale({ model: data.embeddingModel });
    }

    function searchQuery(overrides = {}) {
        const values = {
            q: data.q,
            author: data.author,
            title: data.title,
            semantic: data.semantic ? "1" : "",
            page: data.page,
            ...overrides,
        };

        return Object.entries(values)
            .filter(([, value]) => value !== "" && value !== null && value !== undefined)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join("&");
    }

    function documentsHref(overrides = {}) {
        const query = searchQuery(overrides);
        return query ? `/documents/?${query}` : "/documents/";
    }

    function pageHref(page) {
        return `?${searchQuery({ page })}`;
    }

    function authorHref(author) {
        return documentsHref({ author, page: "" });
    }

    // pdb.snippets() returns plain text with <mark> tags around the matches.
    // It also escapes HTML entities in the matched text. Split those tags into
    // segments so Svelte renders and escapes the text, then decode the entities
    // in each text part: decoding after the split keeps a "&lt;mark&gt;" found
    // in the document from becoming a real tag.
    function snippetSegments(snippet) {
        return snippet
            .split(/(<mark>.*?<\/mark>)/gs)
            .filter((part) => part.length > 0)
            .map((part) => {
                const match = part.match(/^<mark>(.*?)<\/mark>$/s);
                return match
                    ? { text: decodeEntities(match[1]), highlighted: true }
                    : { text: decodeEntities(part), highlighted: false };
            });
    }

    const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };

    function decodeEntities(text) {
        return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
            if (code.startsWith("#")) {
                const value =
                    code[1] === "x" || code[1] === "X"
                        ? Number.parseInt(code.slice(2), 16)
                        : Number.parseInt(code.slice(1), 10);

                return Number.isInteger(value) && value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
            }

            return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
        });
    }
</script>

<svelte:head>
    <title>{m.documents_title()} — {m.app_name()}</title>
</svelte:head>

{#snippet filterEmpty()}
    <p class="text-sm text-gray-500 italic mt-5">{m.documents_no_filter_results()}</p>
    <p class="text-sm mt-2">
        <a
            href={documentsHref({ author: "", title: "", page: "" })}
            class="text-blue-600 hover:underline">{m.documents_clear_filters()}</a
        >
        {#if data.hasQuery}
            <span class="text-gray-300 mx-1">|</span>
            <a
                href="/documents/"
                class="text-blue-600 hover:underline">{m.documents_clear_all()}</a
            >
        {/if}
    </p>
{/snippet}

{#snippet noContentResults()}
    <p class="text-sm text-gray-500 italic mt-5">{m.documents_no_content_results({ query: data.q })}</p>
    {#if data.filtered}
        <p class="text-sm mt-2">
            <a
                href={documentsHref({ author: "", title: "", page: "" })}
                class="text-blue-600 hover:underline">{m.documents_search_all_corpus()}</a
            >
            <span class="text-gray-300 mx-1">|</span>
            <a
                href={documentsHref({ q: "", semantic: "", page: "" })}
                class="text-blue-600 hover:underline">{m.documents_view_selection()}</a
            >
        </p>
    {:else}
        <p class="text-sm text-gray-600 mt-3">{m.documents_try_title_author()}</p>
        <p class="text-sm mt-2">
            <a
                href={documentsHref({ q: "", semantic: "", page: "" })}
                class="text-blue-600 hover:underline">{m.documents_search_clear()}</a
            >
        </p>
    {/if}
{/snippet}

{#snippet selectionStatus()}
    {m.documents_count({ count: data.selectionTotal })}
    {m.documents_selection_suffix()} ·
    <a
        href={documentsHref({ author: "", title: "", page: "" })}
        class="text-blue-600 hover:underline">{m.documents_clear_filters()}</a
    >
{/snippet}

<main class="page px-5 pt-5 pb-10">
    <h1 class="sr-only">{m.documents_title()}</h1>

    <form
        method="GET"
        action="/documents/"
    >
        <div class="mb-4">
            <label
                for="q"
                class="block text-sm font-semibold mb-1"
                >{data.filtered
                    ? m.documents_search_label_filtered({ count: data.selectionTotal })
                    : m.documents_search_label({ count: data.selectionTotal })}</label
            >
            <div class="flex flex-wrap items-end gap-2">
                <div class="grow">
                    <input
                        type="search"
                        id="q"
                        name="q"
                        value={data.q}
                        placeholder={m.documents_search_placeholder()}
                        autocomplete="off"
                        class="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                    />
                </div>
                <button
                    type="submit"
                    class="px-4 py-1.5 rounded-sm text-sm font-semibold cursor-pointer border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                >
                    {m.documents_search_submit()}
                </button>
            </div>
            <p
                id="search-help"
                class="text-xs text-gray-500 mt-1"
            >
                {m.documents_search_help()}
            </p>
            <label class="flex items-center gap-2 text-sm text-gray-700 mt-2">
                <input
                    type="checkbox"
                    name="semantic"
                    value="1"
                    checked={data.semantic}
                    aria-describedby="search-help"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:outline-2 focus:outline-blue-600"
                />
                {m.documents_semantic_label()}
            </label>
        </div>

        <div class="pt-3.5 border-t border-gray-200 mb-1">
            <span class="block text-sm font-semibold mb-1"
                >{m.documents_filters_label()}
                <span class="font-normal text-gray-500">{m.documents_filters_optional()}</span></span
            >
            <div class="flex flex-wrap items-end gap-3">
                <div class="w-56 shrink-0">
                    <label
                        for="author"
                        class="block text-xs font-semibold mb-1 text-gray-700">{m.documents_filter_author()}</label
                    >
                    <input
                        type="text"
                        id="author"
                        name="author"
                        value={data.author}
                        autocomplete="off"
                        class="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                    />
                </div>
                <div class="grow min-w-0">
                    <label
                        for="title"
                        class="block text-xs font-semibold mb-1 text-gray-700">{m.documents_filter_title()}</label
                    >
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={data.title}
                        autocomplete="off"
                        class="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                    />
                </div>
                <button
                    type="submit"
                    class="px-4 py-1.5 rounded-sm text-sm font-semibold cursor-pointer border border-blue-600 bg-white text-blue-600 hover:bg-blue-50"
                >
                    {m.documents_filter_submit()}
                </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">{m.documents_filters_help()}</p>
        </div>
    </form>

    {#if data.hasQuery}
        {#if data.semanticError}
            <p class="text-xs text-amber-700 mt-2">
                <!-- filtered-out and no-matches also mean no vectorized passage matched. -->
                {data.semanticError === "unavailable"
                    ? m.documents_semantic_fallback()
                    : m.documents_semantic_no_vectors()}
            </p>
        {/if}

        {#if data.total > 0}
            <div class="flex flex-wrap items-baseline justify-between gap-3 mt-6 pb-1.5 border-b-2 border-gray-300">
                <h2 class="text-[13px] font-normal text-gray-500">
                    {m.documents_count({ count: data.total })}
                    {#if data.filtered}
                        {m.documents_results_selection_suffix({ selection: data.selectionTotal })}
                    {/if}
                    {m.documents_sorted_relevance({ count: data.total })}
                    {#if data.hybrid}
                        <span
                            class="ml-2 rounded-sm bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700"
                            >{m.documents_hybrid_badge()}</span
                        >
                    {/if}
                    {#if data.semanticMeta}
                        <span class="ml-2">
                            {#if data.semanticMeta.source === "cache"}
                                {m.documents_semantic_cache_hit()}
                            {:else if !data.semanticMeta.tokens}
                                {m.documents_semantic_generated_no_usage()}
                            {:else if data.semanticMeta.costUsd === null}
                                {m.documents_semantic_generated_unpriced({ tokens: data.semanticMeta.tokens })}
                            {:else}
                                {m.documents_semantic_generated({
                                    tokens: data.semanticMeta.tokens,
                                    cost: formatMicroUsd(data.semanticMeta.costUsd),
                                })}
                            {/if}
                        </span>
                    {/if}
                </h2>
                <span class="ml-auto text-[13px] text-gray-500">
                    {#if data.filtered}
                        <a
                            href={documentsHref({ author: "", title: "", page: "" })}
                            class="text-blue-600 hover:underline">{m.documents_clear_filters()}</a
                        >
                        ·
                    {/if}
                    <a
                        href={documentsHref({ q: "", semantic: "", page: "" })}
                        class="text-blue-600 hover:underline">{m.documents_search_clear()}</a
                    >
                </span>
            </div>

            <ol class="list-none m-0 p-0">
                {#each data.documents as document (document.nanoid)}
                    <li class="py-3.5 border-b border-gray-200 hover:bg-gray-100">
                        <p class="text-sm font-semibold leading-snug mb-0.5">
                            <a
                                href="/documents/{document.nanoid}/"
                                class="text-blue-600 no-underline hover:underline">{document.title}</a
                            >
                        </p>
                        <div class="text-xs text-gray-500">
                            {#each document.authors as author, index (index)}
                                {#if index > 0}<span>, </span>{/if}<a
                                    href={authorHref(author)}
                                    class="text-blue-600 no-underline hover:underline">{author}</a
                                >
                            {/each}
                            {#if document.authors.length > 0}<span class="text-gray-400 px-1">·</span>{/if}
                            {document.original_published_date ?? "—"}
                            <span class="text-gray-400 px-1">·</span>
                            {#if document.source_url}
                                <a
                                    href={document.source_url}
                                    class="text-blue-600 no-underline hover:underline">{m.documents_source_link()}</a
                                >
                            {:else if document.source_kind === "epub"}
                                <span
                                    class="inline-block rounded-sm border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                                    >{m.documents_source_epub()}</span
                                >
                            {:else}
                                <span class="text-gray-400">—</span>
                            {/if}
                            {#if document.vectorRank || document.bm25Rank}
                                <span class="text-gray-400 px-1">·</span>
                                <span class="text-gray-600"
                                    >{#if document.vectorRank}
                                        {document.bm25Rank
                                            ? m.documents_rank_both({
                                                  bm25: document.bm25Rank,
                                                  vector: document.vectorRank,
                                              })
                                            : m.documents_rank_vector({ vector: document.vectorRank })}
                                    {:else}
                                        {m.documents_rank_bm25({ bm25: document.bm25Rank })}
                                    {/if}</span
                                >
                            {/if}
                        </div>
                        {#if document.bestChunk}
                            <p class="text-xs text-gray-500 mt-1 truncate">{document.bestChunk.heading_path}</p>
                            <p class="text-sm leading-relaxed text-gray-700">{document.bestChunk.content}</p>
                        {:else}
                            {#each document.snippets ?? [] as snippet, snippetIndex (snippetIndex)}
                                <p class="text-sm leading-relaxed text-gray-700 mt-1">
                                    {#each snippetSegments(snippet) as segment, segmentIndex (segmentIndex)}
                                        {#if segment.highlighted}<mark>{segment.text}</mark>{:else}{segment.text}{/if}
                                    {/each}
                                </p>
                            {/each}
                        {/if}
                    </li>
                {/each}
            </ol>
        {:else if data.filtered && data.selectionTotal === 0}
            {@render filterEmpty()}
        {:else}
            {@render noContentResults()}
        {/if}
    {:else if data.filtered && data.selectionTotal === 0}
        {@render filterEmpty()}
    {:else if data.corpusTotal === 0}
        <p class="text-sm text-gray-500 italic mt-5">{m.documents_empty()}</p>
    {:else}
        <div class="overflow-x-auto mt-6">
            <table class="w-full text-sm border-collapse table-fixed">
                <colgroup>
                    <col class="w-28" />
                    <col class="w-24" />
                    <col class="w-36" />
                    <col />
                    <col class="w-24" />
                    <col class="w-20" />
                </colgroup>
                <thead>
                    <tr>
                        <th
                            class="cursor-help text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                            scope="col"
                            title={m.documents_column_original_date()}>{m.documents_column_published_on()}</th
                        >
                        <th
                            scope="col"
                            class="whitespace-nowrap text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                            >{m.documents_column_type()}</th
                        >
                        <th
                            class="whitespace-nowrap text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                            scope="col">{m.documents_column_authors()}</th
                        >
                        <th
                            scope="col"
                            class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                        >
                            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span>{m.documents_column_title()}</span>
                                {#if data.filtered}
                                    <span class="ml-auto text-xs font-normal normal-case tracking-normal text-gray-600">
                                        {@render selectionStatus()}
                                    </span>
                                {/if}
                            </div>
                        </th>
                        <th
                            scope="col"
                            class="cursor-help whitespace-nowrap text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                            title={m.documents_column_vectorized_title()}>{m.documents_column_vectorized()}</th
                        >
                        <th
                            scope="col"
                            class="whitespace-nowrap text-right text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 border-b-2 border-gray-300"
                            >{m.documents_column_source()}</th
                        >
                    </tr>
                </thead>
                <tbody>
                    {#each data.documents as doc (doc.nanoid)}
                        <tr class="hover:bg-gray-100">
                            <td class="py-1.5 pr-2 border-b border-gray-200 align-top text-gray-500 whitespace-nowrap">
                                {doc.original_published_date ?? "—"}
                            </td>
                            <td class="py-1.5 pr-2 border-b border-gray-200 align-top whitespace-nowrap">
                                <span
                                    class={doc.kind === "book"
                                        ? "inline-block rounded-sm bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700"
                                        : "inline-block rounded-sm border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600"}
                                >
                                    {doc.kind === "book" ? m.documents_type_book() : m.documents_type_document()}
                                </span>
                            </td>
                            <td class="py-1.5 pr-2 border-b border-gray-200 align-top whitespace-nowrap">
                                {#if doc.authors.length > 0}
                                    {#each doc.authors as author, index (index)}
                                        {#if index > 0}<span>, </span>{/if}<a
                                            href={authorHref(author)}
                                            class="text-blue-600 no-underline hover:underline">{author}</a
                                        >
                                    {/each}
                                {:else}
                                    —
                                {/if}
                            </td>
                            <td class="py-1.5 pr-2 border-b border-gray-200 align-top">
                                <a
                                    href="/documents/{doc.nanoid}/"
                                    class="text-blue-600 no-underline hover:underline">{doc.title}</a
                                >
                            </td>
                            <td
                                class="py-1.5 pr-2 border-b border-gray-200 align-top whitespace-nowrap text-[11px] text-gray-600"
                                title={vectorizationHint(doc.vectorization)}
                            >
                                {vectorizationLabel(doc.vectorization)}
                                {#if doc.vectorization === "none"}
                                    <span class="sr-only">{m.documents_vectorized_hint_none()}</span>
                                {/if}
                            </td>
                            <td class="py-1.5 border-b border-gray-200 align-top text-right whitespace-nowrap">
                                {#if doc.source_url}
                                    <a
                                        href={doc.source_url}
                                        class="text-xs text-gray-500 no-underline hover:text-blue-600 hover:underline"
                                        >{m.documents_source_link()}</a
                                    >
                                {:else if doc.source_kind === "epub"}
                                    <span
                                        class="inline-block rounded-sm border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                                        >{m.documents_source_epub()}</span
                                    >
                                {:else}
                                    <span class="text-gray-400">—</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    {#if data.totalPages > 1}
        <nav class="pagination flex items-center gap-2 mt-5 text-sm">
            {#if data.page > 1}
                <a
                    href={pageHref(1)}
                    class="text-blue-600 no-underline hover:underline">{m.documents_page_first()}</a
                >
                <a
                    href={pageHref(data.page - 1)}
                    class="text-blue-600 no-underline hover:underline">{m.documents_page_prev()}</a
                >
            {:else}
                <span class="text-gray-400">{m.documents_page_first()}</span>
                <span class="text-gray-400">{m.documents_page_prev()}</span>
            {/if}
            <span class="text-gray-300 mx-1">|</span>
            <span class="text-gray-500">{m.documents_page_info({ page: data.page, total: data.totalPages })}</span>
            <span class="text-gray-300 mx-1">|</span>
            {#if data.page < data.totalPages}
                <a
                    href={pageHref(data.page + 1)}
                    class="text-blue-600 no-underline hover:underline">{m.documents_page_next()}</a
                >
                <a
                    href={pageHref(data.totalPages)}
                    class="text-blue-600 no-underline hover:underline">{m.documents_page_last()}</a
                >
            {:else}
                <span class="text-gray-400">{m.documents_page_next()}</span>
                <span class="text-gray-400">{m.documents_page_last()}</span>
            {/if}
        </nav>
    {/if}
</main>

<style>
    :global(mark) {
        background: #fef08a;
        color: inherit;
        padding: 0 1px;
    }
</style>
