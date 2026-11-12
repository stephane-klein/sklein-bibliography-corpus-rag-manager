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

    {#if data.contentNode.is_container}
        <h2 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            {m.documents_detail_sections()}
        </h2>
        <ol class="list-none m-0 p-0">
            {#each data.children as child (child.nanoid)}
                <li class="py-2 border-b border-gray-200">
                    <a
                        href="/documents/{child.nanoid}/"
                        class="text-blue-600 no-underline hover:underline">{child.title}</a
                    >
                </li>
            {/each}
        </ol>
    {:else}
        <h2 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{m.documents_detail_content()}</h2>
        <pre
            class="whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 border border-gray-200 rounded-sm p-4 leading-relaxed">{data
                .contentNode.content}</pre>
    {/if}
</main>
