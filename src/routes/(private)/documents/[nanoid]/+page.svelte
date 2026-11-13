<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();
</script>

<svelte:head>
    <title>{data.contentNode.title} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-7 pb-16">
    <div class="mx-auto max-w-[46rem]">
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
            <h2 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                {m.documents_detail_content()}
            </h2>
            <article class="markdown-body">
                <!-- The HTML comes from renderMarkdown, where raw HTML is escaped. -->
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html data.contentHtml}
            </article>
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
</style>
