<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();
</script>

<svelte:head>
    <title>{m.dashboard_title()} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-2 tracking-tight">{m.dashboard_title()}</h1>
    <p class="text-gray-500 text-sm mb-6">{m.dashboard_welcome({ name: data.user.display_name })}</p>

    <p class="text-sm text-gray-500">{m.dashboard_signed_in_as({ email: data.user.email })}</p>
</main>
