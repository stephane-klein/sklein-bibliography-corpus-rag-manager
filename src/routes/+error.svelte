<script>
    import { m } from "#lib/paraglide/messages.js";
    import { page } from "$app/state";
</script>

<svelte:head>
    {#if page.status === 404}
        <title>{m.error_404_title()} — {m.app_name()}</title>
    {:else if page.status === 403}
        <title>{m.error_403_title()} — {m.app_name()}</title>
    {:else if page.status === 503}
        <title>{m.error_503_title()} — {m.app_name()}</title>
    {:else}
        <title>{m.error_generic_title()} — {m.app_name()}</title>
    {/if}
</svelte:head>

<main class="page px-5 pt-12 pb-24">
    {#if page.status === 404}
        <p class="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">404</p>

        <h1 class="text-2xl font-bold mb-2 tracking-tight">{m.error_404_title()}</h1>
        <p class="text-sm text-gray-500 mb-6 max-w-md">
            {m.error_404_message()}
        </p>
        <div class="flex gap-3 items-center flex-wrap">
            <a
                href="/"
                class="px-4 py-1.5 bg-blue-600 text-white border border-blue-600 rounded-sm text-sm font-semibold no-underline hover:bg-blue-700"
                >{m.error_404_cta_home()}</a
            >
            <button
                onclick={() => history.back()}
                class="px-4 py-1.5 bg-transparent text-gray-500 border border-gray-300 rounded-sm text-sm no-underline hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                >{m.error_go_back()}</button
            >
        </div>
    {:else if page.status === 403}
        <p class="font-mono text-xs font-bold text-red-600 uppercase tracking-wider mb-2">403</p>

        <h1 class="text-2xl font-bold mb-2 tracking-tight">{m.error_403_title()}</h1>
        <p class="text-sm text-gray-500 mb-6 max-w-md">
            {m.error_403_message()}
        </p>
        <div class="flex gap-3 items-center flex-wrap">
            <a
                href="/"
                class="px-4 py-1.5 bg-blue-600 text-white border border-blue-600 rounded-sm text-sm font-semibold no-underline hover:bg-blue-700"
                >{m.error_403_cta_home()}</a
            >
            <a
                href="mailto:admin@example.com"
                class="px-4 py-1.5 bg-transparent text-gray-500 border border-gray-300 rounded-sm text-sm no-underline hover:bg-gray-100 hover:text-gray-900"
                >{m.error_403_cta_contact()}</a
            >
        </div>
    {:else if page.status === 503}
        <p class="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">503</p>

        <h1 class="text-2xl font-bold mb-2 tracking-tight">{m.error_503_title()}</h1>
        <p class="text-sm text-gray-500 mb-6 max-w-md">
            {m.error_503_message()}
        </p>
    {:else}
        {#if page.status}
            <p class="font-mono text-xs font-bold text-red-600 uppercase tracking-wider mb-2">{page.status}</p>
        {/if}
        <h1 class="text-2xl font-bold mb-2 tracking-tight">{m.error_generic_title()}</h1>
        <p class="text-sm text-gray-500 mb-6 max-w-md">
            {m.error_generic_message()}
        </p>
        <div class="flex gap-3 items-center flex-wrap">
            <button
                onclick={() => location.reload()}
                class="px-4 py-1.5 bg-blue-600 text-white border border-blue-600 rounded-sm text-sm font-semibold no-underline hover:bg-blue-700 cursor-pointer"
                >{m.error_generic_cta_reload()}</button
            >
            <a
                href="/"
                class="px-4 py-1.5 bg-transparent text-gray-500 border border-gray-300 rounded-sm text-sm no-underline hover:bg-gray-100 hover:text-gray-900"
                >{m.error_generic_cta_home()}</a
            >
        </div>

        {#if page.error?.message}
            <details class="mt-7 pt-5 border-t border-gray-300">
                <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-900 select-none"
                    >{m.error_technical_details()}</summary
                >
                <pre
                    class="mt-2.5 font-mono text-xs bg-gray-100 border border-gray-300 rounded-sm p-3 overflow-x-auto text-gray-500 leading-relaxed">{page
                        .error.message}</pre>
            </details>
        {/if}
    {/if}
</main>
