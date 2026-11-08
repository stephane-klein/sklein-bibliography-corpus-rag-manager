<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();
</script>

<svelte:head>
    <title>{data.contentNode.title} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-7 pb-16">
    <a
        href="/documents"
        class="text-sm text-blue-600 no-underline hover:underline">{m.documents_back()}</a
    >

    <h1 class="text-xl font-bold mt-4 mb-5">{data.contentNode.title}</h1>

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
                    class="text-blue-600 break-all no-underline hover:underline">{data.contentNode.source_url}</a
                >
            {:else}
                —
            {/if}
        </dd>
    </dl>

    <h2 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{m.documents_detail_content()}</h2>
    <pre
        class="whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 border border-gray-200 rounded-sm p-4 leading-relaxed">{data
            .contentNode.content}</pre>
</main>
