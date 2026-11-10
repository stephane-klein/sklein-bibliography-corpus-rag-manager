<script>
    import { m } from "#lib/paraglide/messages.js";
    import { page } from "$app/state";

    let { children } = $props();

    function isActive(href) {
        return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
    }
</script>

<header class="border-b border-gray-300 bg-white">
    <div class="page px-5 py-2 flex items-center justify-between">
        <a
            href="/dashboard"
            class="font-bold text-base no-underline">{m.app_name()}</a
        >
        <nav>
            <a
                href="/dashboard"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline"
                class:active={isActive("/dashboard")}
                aria-current={isActive("/dashboard") ? "page" : undefined}>{m.nav_dashboard()}</a
            >
            |
            <a
                href="/documents"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline"
                class:active={isActive("/documents")}
                aria-current={isActive("/documents") ? "page" : undefined}>{m.nav_documents()}</a
            >
            |
            <a
                href="/contacts"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline"
                class:active={isActive("/contacts")}
                aria-current={isActive("/contacts") ? "page" : undefined}>{m.nav_contacts()}</a
            >
            |
            <a
                href="/my/profile"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline"
                class:active={isActive("/my/profile")}
                aria-current={isActive("/my/profile") ? "page" : undefined}>{m.nav_profile()}</a
            >
            |
            <a
                href="/my/preference"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline"
                class:active={isActive("/my/preference")}
                aria-current={isActive("/my/preference") ? "page" : undefined}>{m.nav_preferences()}</a
            >
            |
            <a
                href="/my/tokens"
                class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline"
                class:active={isActive("/my/tokens")}
                aria-current={isActive("/my/tokens") ? "page" : undefined}>{m.nav_tokens()}</a
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

<style>
    nav a.active {
        color: #111827;
        font-weight: 600;
    }

    nav a.active:hover {
        color: #111827;
        text-decoration: none;
    }
</style>
