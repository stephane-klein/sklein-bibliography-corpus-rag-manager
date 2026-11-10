<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();

    function searchQuery(overrides = {}) {
        const values = {
            q: data.q,
            author: data.author,
            title: data.title,
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
    // Split those tags into segments so Svelte renders and escapes the text.
    function snippetSegments(snippet) {
        return snippet
            .split(/(<mark>.*?<\/mark>)/gs)
            .filter((part) => part.length > 0)
            .map((part) => {
                const match = part.match(/^<mark>(.*?)<\/mark>$/s);
                return match ? { text: match[1], highlighted: true } : { text: part, highlighted: false };
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
                href={documentsHref({ q: "", page: "" })}
                class="text-blue-600 hover:underline">{m.documents_view_selection()}</a
            >
        </p>
    {:else}
        <p class="text-sm text-gray-600 mt-3">{m.documents_try_title_author()}</p>
        <p class="text-sm mt-2">
            <a
                href={documentsHref({ q: "", page: "" })}
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
            <p class="text-xs text-gray-500 mt-1">{m.documents_search_help()}</p>
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
        {#if data.total > 0}
            <div class="flex flex-wrap items-baseline justify-between gap-3 mt-6 pb-1.5 border-b-2 border-gray-300">
                <h2 class="text-[13px] font-normal text-gray-500">
                    {m.documents_count({ count: data.total })}
                    {#if data.filtered}
                        {m.documents_results_selection_suffix({ selection: data.selectionTotal })}
                    {/if}
                    {m.documents_sorted_relevance({ count: data.total })}
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
                        href={documentsHref({ q: "", page: "" })}
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
                            {:else}
                                <span class="text-gray-400">—</span>
                            {/if}
                        </div>
                        {#each document.snippets ?? [] as snippet, snippetIndex (snippetIndex)}
                            <p class="text-sm leading-relaxed text-gray-700 mt-1">
                                {#each snippetSegments(snippet) as segment, segmentIndex (segmentIndex)}
                                    {#if segment.highlighted}<mark>{segment.text}</mark>{:else}{segment.text}{/if}
                                {/each}
                            </p>
                        {/each}
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
                    <col class="w-36" />
                    <col />
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
                            class="whitespace-nowrap text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                            scope="col">{m.documents_column_authors()}</th
                        >
                        <th
                            colspan="2"
                            scope="colgroup"
                            class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 border-b-2 border-gray-300"
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
                    </tr>
                </thead>
                <tbody>
                    {#each data.documents as doc (doc.nanoid)}
                        <tr class="hover:bg-gray-100">
                            <td class="py-1.5 pr-2 border-b border-gray-200 align-top text-gray-500 whitespace-nowrap">
                                {doc.original_published_date ?? "—"}
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
                            <td class="py-1.5 border-b border-gray-200 align-top text-right whitespace-nowrap">
                                {#if doc.source_url}
                                    <a
                                        href={doc.source_url}
                                        class="text-xs text-gray-500 no-underline hover:text-blue-600 hover:underline"
                                        >{m.documents_source_link()}</a
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
