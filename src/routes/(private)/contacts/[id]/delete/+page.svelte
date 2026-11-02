<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();
</script>

<svelte:head>
    <title>{m.contact_delete_title()} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-6 tracking-tight">{m.contact_delete_title()}</h1>

    <p class="text-sm text-gray-600 mb-4">
        {m.contact_delete_confirm({ firstname: data.contact.firstname, lastname: data.contact.lastname })}
    </p>

    <form method="POST">
        <div class="flex items-center gap-3">
            <button
                type="submit"
                class="px-4 py-1.5 rounded-sm text-sm font-semibold cursor-pointer border border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700"
            >
                {m.contact_delete_yes()}
            </button>
            <a
                href="/contacts"
                class="text-sm text-blue-600 hover:underline">{m.contact_delete_cancel()}</a
            >
        </div>
    </form>
</main>
