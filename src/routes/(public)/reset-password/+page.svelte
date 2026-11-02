<script>
    import { dev } from "$app/env";
    import { m } from "#lib/paraglide/messages.js";

    let { form } = $props();
</script>

<svelte:head>
    <title>{m.reset_password_title()} — {m.app_name()}</title>
</svelte:head>

<header class="border-b border-gray-300">
    <div class="page px-5 py-2">
        <a
            href="/"
            class="font-bold text-base no-underline hover:underline">{m.app_name()}</a
        >
    </div>
</header>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-2 tracking-tight">{m.reset_password_title()}</h1>
    <p class="text-sm text-gray-500 mb-6 max-w-sm">
        {m.reset_password_desc()}
    </p>

    {#if form?.mail_unavailable}
        <div class="max-w-sm">
            <p class="text-sm text-red-600 mb-2">{m.reset_password_mail_unavailable_title()}</p>
            <p class="text-xs text-gray-500">
                {m.reset_password_mail_unavailable_desc()}
            </p>
        </div>
    {:else if form?.sent}
        <div class="max-w-sm">
            <p class="text-sm mb-2">{m.reset_password_sent({ email: form.email })}</p>
            <p class="text-xs text-gray-500">
                {m.reset_password_check_inbox()}
                {#if dev && form.resetLink}
                    <br />{m.reset_password_debug()}
                    <a
                        href="/change-password?token={form.resetLink.split('token=')[1]}"
                        class="text-blue-600 hover:underline">reset link</a
                    >
                {/if}
            </p>
        </div>
    {:else}
        {#if form?.error}
            <p class="text-sm text-red-600 mb-3.5">{form.error}</p>
        {/if}

        <form
            method="POST"
            class="max-w-sm"
            novalidate
        >
            <div class="mb-3">
                <label
                    for="email"
                    class="block text-sm font-semibold mb-1">{m.reset_password_email_label()}</label
                >
                <!-- svelte-ignore a11y_autofocus -->
                <input
                    type="email"
                    id="email"
                    name="email"
                    autocomplete="email"
                    autofocus
                    required
                    class="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                />
            </div>

            <div class="mt-4 flex items-center gap-3.5">
                <button
                    type="submit"
                    class="px-4 py-1.5 bg-blue-600 text-white border border-blue-600 rounded-sm text-sm font-semibold cursor-pointer hover:bg-blue-700 hover:border-blue-700"
                >
                    {m.reset_password_send()}
                </button>
            </div>
        </form>
    {/if}

    <p class="mt-5 pt-4 border-t border-gray-300 text-sm text-gray-500">
        <a
            href="/login"
            class="text-blue-600 hover:underline">{m.reset_password_back_signin()}</a
        >
        |
        <a
            href="/"
            class="text-blue-600 hover:underline">{m.reset_password_homepage()}</a
        >
    </p>
</main>
