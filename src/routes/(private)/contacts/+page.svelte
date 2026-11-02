<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();
</script>

<svelte:head>
    <title>{m.contacts_title()} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-7 pb-16">
    <div class="flex items-baseline gap-3 mb-5">
        <h1 class="text-xl font-bold">{m.contacts_title()}</h1>
        <span class="text-sm text-gray-500">{data.totalPages > 0 ? `${data.contacts.length} / 1000` : ""}</span>
        <div class="flex-1"></div>
        <a
            href="/contacts/new"
            class="text-sm text-blue-600 no-underline hover:underline">{m.contacts_new_button()}</a
        >
    </div>

    {#if data.contacts.length === 0}
        <p class="text-sm text-gray-500 italic">{m.contacts_empty()}</p>
    {:else}
        <table class="w-full text-sm border-collapse">
            <thead>
                <tr>
                    <th
                        class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                        >{m.contacts_column_id()}</th
                    >
                    <th
                        class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                        >{m.contacts_column_firstname()}</th
                    >
                    <th
                        class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                        >{m.contacts_column_lastname()}</th
                    >
                    <th
                        class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 pr-2 border-b-2 border-gray-300"
                        >{m.contacts_column_created()}</th
                    >
                    <th class="text-right text-xs pb-1.5 border-b-2 border-gray-300"></th>
                </tr>
            </thead>
            <tbody>
                {#each data.contacts as contact (contact.id)}
                    <tr class="hover:bg-gray-50">
                        <td class="py-1.5 pr-2 border-b border-gray-200 font-mono text-xs text-gray-500"
                            >{contact.id}</td
                        >
                        <td class="py-1.5 pr-2 border-b border-gray-200">{contact.firstname}</td>
                        <td class="py-1.5 pr-2 border-b border-gray-200">{contact.lastname}</td>
                        <td class="py-1.5 pr-2 border-b border-gray-200 text-gray-500"
                            >{new Date(contact.created_at).toLocaleDateString()}</td
                        >
                        <td class="py-1.5 border-b border-gray-200 text-right whitespace-nowrap">
                            <a
                                href="/contacts/{contact.id}/edit"
                                class="text-xs text-gray-500 no-underline hover:text-blue-600 hover:underline"
                                >{m.contacts_action_edit()}</a
                            >
                            <span class="text-gray-300 mx-1">|</span>
                            <a
                                href="/contacts/{contact.id}/delete"
                                class="text-xs text-red-600 no-underline hover:underline"
                                >{m.contacts_action_delete()}</a
                            >
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <nav class="pagination flex items-center gap-2 mt-5 text-sm">
            {#if data.page > 1}
                <a
                    href="?page=1"
                    class="text-blue-600 no-underline hover:underline">« First</a
                >
                <a
                    href="?page={data.page - 1}"
                    class="text-blue-600 no-underline hover:underline">‹ Prev</a
                >
            {:else}
                <span class="text-gray-400">« First</span>
                <span class="text-gray-400">‹ Prev</span>
            {/if}
            <span class="text-gray-300 mx-1">|</span>
            <span class="text-gray-500">{m.contacts_page_info({ page: data.page, total: data.totalPages })}</span>
            <span class="text-gray-300 mx-1">|</span>
            {#if data.page < data.totalPages}
                <a
                    href="?page={data.page + 1}"
                    class="text-blue-600 no-underline hover:underline">Next ›</a
                >
                <a
                    href="?page={data.totalPages}"
                    class="text-blue-600 no-underline hover:underline">Last »</a
                >
            {:else}
                <span class="text-gray-400">Next ›</span>
                <span class="text-gray-400">Last »</span>
            {/if}
        </nav>
    {/if}
</main>
