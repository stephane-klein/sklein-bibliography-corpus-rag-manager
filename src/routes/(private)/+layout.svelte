<script>
    import { m } from "#lib/paraglide/messages.js";

    let { children } = $props();
</script>

<header class="border-b border-gray-300">
    <div class="page px-5 py-2 flex items-center justify-between">
        <a
            href="/dashboard"
            class="font-bold text-base no-underline">{m.app_name()}</a
        >
        <nav>
            <a
                href="/dashboard"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline">{m.nav_dashboard()}</a
            >
            |
            <a
                href="/contacts"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline">{m.nav_contacts()}</a
            >
            |
            <a
                href="/my/profile"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline">{m.nav_profile()}</a
            >
            |
            <a
                href="/my/preference"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline">{m.nav_preferences()}</a
            >
            |
            <a
                href="/my/tokens"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline">{m.nav_tokens()}</a
            >
            |
            <a
                href="/logout"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline">{m.nav_sign_out()}</a
            >
        </nav>
    </div>
</header>

{@render children()}
