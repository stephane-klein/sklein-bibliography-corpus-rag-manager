<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();
</script>

<svelte:head>
    <title>{m.magic_sent_title()} — {m.app_name()}</title>
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
    <h1 class="text-xl font-bold mb-2 tracking-tight">{m.magic_sent_title()}</h1>

    <p class="text-sm mb-6 max-w-sm">
        {m.magic_sent_desc({ email: data.email })}
    </p>

    <p class="text-xs text-gray-500 mb-2 max-w-sm">{m.magic_sent_hint()}</p>

    <p class="text-sm text-gray-500">
        <a
            href="/login"
            class="text-blue-600 hover:underline">{m.magic_sent_different_email()}</a
        >
        |
        <a
            href="/"
            class="text-blue-600 hover:underline">{m.magic_sent_go_home()}</a
        >
    </p>
</main>
