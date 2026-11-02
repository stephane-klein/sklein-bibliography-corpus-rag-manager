<script>
    import { m } from "#lib/paraglide/messages.js";

    let { form } = $props();
</script>

<svelte:head>
    <title>{m.contact_new_title()} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-6 tracking-tight">{m.contact_new_title()}</h1>

    {#if form?.error}
        <p class="text-sm text-red-600 mb-3.5">{form.error}</p>
    {/if}

    <form
        method="POST"
        class="max-w-sm"
    >
        <div class="mb-3">
            <label
                for="firstname"
                class="block text-sm font-semibold mb-1">{m.contact_new_firstname_label()}</label
            >
            <!-- svelte-ignore a11y_autofocus -->
            <input
                type="text"
                id="firstname"
                name="firstname"
                autocomplete="off"
                autofocus
                required
                class="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
            />
        </div>

        <div class="mb-3">
            <label
                for="lastname"
                class="block text-sm font-semibold mb-1">{m.contact_new_lastname_label()}</label
            >
            <input
                type="text"
                id="lastname"
                name="lastname"
                autocomplete="off"
                required
                class="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
            />
        </div>

        <div class="flex items-center gap-3 mt-4">
            <button
                type="submit"
                class="px-4 py-1.5 rounded-sm text-sm font-semibold cursor-pointer border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
            >
                {m.contact_new_create()}
            </button>
            <a
                href="/contacts"
                class="text-sm text-blue-600 hover:underline">{m.contact_new_cancel()}</a
            >
        </div>
    </form>
</main>
