<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data, form } = $props();
</script>

<svelte:head>
    <title>{m.login_title()} — {m.app_name()}</title>
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
    <h1 class="text-xl font-bold mb-6 tracking-tight">{m.login_title()}</h1>

    {#if form?.error}
        <p class="text-sm text-red-600 mb-3.5">{form.error}</p>
    {/if}

    {#if form?.magicLinkError}
        <p class="text-sm text-red-600 mb-3.5">{form.magicLinkError}</p>
    {/if}

    {#if form?.magicLinkUnavailable}
        <div class="max-w-sm mb-5">
            <p class="text-sm text-red-600 mb-1">{m.login_mail_unavailable_title()}</p>
            <p class="text-xs text-gray-500">{m.login_mail_unavailable_desc()}</p>
        </div>
    {/if}

    {#if data.autheliaEnabled}
        <a
            href="/login/oidc/authorize"
            class="block max-w-sm text-center px-4 py-1.5 border border-gray-300 rounded-sm text-sm font-semibold mb-5 hover:bg-gray-50"
        >
            {m.login_authelia()}
        </a>

        <hr class="max-w-sm mb-5 border-gray-300" />
    {/if}

    <form
        method="POST"
        action="?/signIn"
        class="max-w-sm"
        novalidate
    >
        <div class="mb-3">
            <label
                for="email"
                class="block text-sm font-semibold mb-1">{m.login_email_label()}</label
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

        <div class="mb-3">
            <label
                for="password"
                class="block text-sm font-semibold mb-1">{m.login_password_label()}</label
            >
            <input
                type="password"
                id="password"
                name="password"
                autocomplete="current-password"
                required
                class="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
            />
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3.5">
            <button
                type="submit"
                class="px-4 py-1.5 bg-blue-600 text-white border border-blue-600 rounded-sm text-sm font-semibold cursor-pointer hover:bg-blue-700 hover:border-blue-700"
            >
                {m.sign_in()}
            </button>
            <button
                type="submit"
                formaction="?/magicLink"
                class="px-4 py-1.5 border border-gray-300 rounded-sm text-sm font-semibold cursor-pointer hover:bg-gray-50"
            >
                {m.login_magic_link()}
            </button>
            <a
                href="/reset-password"
                class="text-sm text-blue-600 hover:underline">{m.login_forgot_password()}</a
            >
        </div>
    </form>

    <p class="mt-5 pt-4 border-t border-gray-300 text-sm text-gray-500">
        {m.login_no_account()}
        <a
            href="/signup"
            class="text-blue-600 hover:underline">{m.login_create_one()}</a
        >
        |
        <a
            href="/"
            class="text-blue-600 hover:underline">{m.login_back_home()}</a
        >
    </p>
</main>
