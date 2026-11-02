<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data, form } = $props();
</script>

<svelte:head>
    <title>{m.my_password_title()} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-7 tracking-tight">{m.my_password_title()}</h1>

    <div class="mb-9">
        <h2 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1.5 border-b border-gray-300">
            {m.my_password_section()}
        </h2>

        {#if form?.error}
            <p class="text-sm text-red-600 mb-3.5">{form.error}</p>
        {/if}

        {#if form?.saved}
            <p class="text-sm text-green-700 mb-3.5">{m.my_password_updated()}</p>
        {/if}

        <form
            method="POST"
            action="?/changePassword"
        >
            {#if data.hasPassword}
                <div class="mb-3.5">
                    <label
                        for="current-password"
                        class="block text-sm font-semibold mb-1">{m.my_password_current_label()}</label
                    >
                    <input
                        type="password"
                        id="current-password"
                        name="current-password"
                        autocomplete="current-password"
                        required
                        class="w-full max-w-sm px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                    />
                    <p class="text-xs text-gray-500 mt-1.5">{m.my_password_forgot_hint()}</p>
                    {#if form?.resetSent}
                        <span class="text-xs text-green-600 block mt-1">
                            {m.my_password_reset_sent({ email: data.email })}
                        </span>
                    {:else if form?.resetError}
                        <span class="text-xs text-red-600 block mt-1">{form.resetError}</span>
                    {:else if form?.mail_unavailable}
                        <span class="text-xs text-red-600 block mt-1">{m.my_password_reset_mail_unavailable()}</span>
                    {:else}
                        <button
                            type="submit"
                            formaction="?/sendResetLink"
                            formnovalidate
                            class="text-xs text-blue-600 underline cursor-pointer mt-1"
                        >
                            {m.my_password_send_reset_link({ email: data.email })}
                        </button>
                    {/if}
                </div>
            {:else}
                <p class="text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-sm px-3 py-2 mb-3.5">
                    {m.my_password_no_password_note()}
                </p>
            {/if}

            <div class="mb-3.5">
                <label
                    for="new-password"
                    class="block text-sm font-semibold mb-1">{m.my_password_new_label()}</label
                >
                <input
                    type="password"
                    id="new-password"
                    name="new-password"
                    autocomplete="new-password"
                    required
                    class="w-full max-w-sm px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                />
                <p class="text-xs text-gray-500 mt-1">{m.my_password_hint()}</p>
            </div>

            <div class="mb-3.5">
                <label
                    for="confirm"
                    class="block text-sm font-semibold mb-1">{m.my_password_confirm_label()}</label
                >
                <input
                    type="password"
                    id="confirm"
                    name="confirm"
                    autocomplete="new-password"
                    required
                    class="w-full max-w-sm px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                />
            </div>

            <div class="flex items-center gap-3 mt-1.5">
                <button
                    type="submit"
                    class="px-4 py-1.5 rounded-sm text-sm font-semibold cursor-pointer border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                >
                    {m.my_password_update()}
                </button>
            </div>
        </form>
    </div>
</main>
