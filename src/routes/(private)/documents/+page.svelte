<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();

    function pageHref(page) {
        const query = data.q ? `q=${encodeURIComponent(data.q)}&` : "";
        return `?${query}page=${page}`;
    }
</script>

<svelte:head>
    <title>{m.documents_title()} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-7 pb-16">
    <div class="flex items-baseline gap-3 mb-5">
        <h1 class="text-xl font-bold">{m.documents_title()}</h1>
        <span class="text-sm text-gray-500">{m.documents_count({ count: data.total })}</span>
    </div>

    <form
        method="GET"
        class="flex flex-wrap items-end gap-2 mb-5"
    >
        <div class="grow">
            <label
                for="q"
                class="block text-sm font-semibold mb-1">{m.documents_search_label()}</label
            >
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
        {#if data.q}
            <a
                href="/documents"
                class="text-sm text-blue-600 hover:underline">{m.documents_search_clear()}</a
            >
        {/if}
    </form>

    {#if data.documents.length === 0 && data.q}
        <p class="text-sm text-gray-500 italic">{m.documents_no_results({ query: data.q })}</p>
    {:else if data.documents.length === 0}
        <p class="text-sm text-gray-500 italic">{m.documents_empty()}</p>
    {:else}
        <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
                <thead>
                    <tr>
                        <th
                            class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                            scope="col">{m.documents_column_original_date()}</th
                        >
                        <th
                            class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                            scope="col">{m.documents_column_title()}</th
                        >
                        <th
                            class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                            scope="col">{m.documents_column_authors()}</th
                        >
                        <th
                            class="text-right text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 border-b-2 border-gray-300"
                            scope="col">{m.documents_column_source()}</th
                        >
                    </tr>
                </thead>
                <tbody>
                    {#each data.documents as doc (doc.nanoid)}
                        <tr class="hover:bg-gray-50">
                            <td class="py-1.5 pr-2 border-b border-gray-200 align-top text-gray-500 whitespace-nowrap">
                                {doc.original_published_date ?? "—"}
                            </td>
                            <td class="py-1.5 pr-2 border-b border-gray-200 align-top">
                                <a
                                    href="/documents/{doc.nanoid}"
                                    class="text-blue-600 no-underline hover:underline">{doc.title}</a
                                >
                            </td>
                            <td class="py-1.5 pr-2 border-b border-gray-200 align-top">
                                {doc.authors.length > 0 ? doc.authors.join(", ") : "—"}
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
