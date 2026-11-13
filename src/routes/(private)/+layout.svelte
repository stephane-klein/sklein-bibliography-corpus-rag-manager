<script>
    import { setContext, untrack } from "svelte";
    import { m } from "#lib/paraglide/messages.js";
    import { page } from "$app/state";
    import {
        DOCUMENTS_DENSITY_CONTEXT,
        DOCUMENTS_DENSITY_COOKIE,
        DOCUMENTS_DENSITY_DENSE,
        DOCUMENTS_DENSITY_DETAILED,
        DOCUMENTS_DENSITY_MAX_AGE,
    } from "#lib/shared/documents-density.js";

    let { children, data } = $props();

    let dense = $state(untrack(() => data.dense));

    // Only the documents list has two layouts. Showing the switch on a page it
    // does not change would promise an action without effect.
    const onDocumentsList = $derived(page.url.pathname.replace(/\/+$/, "") === "/documents");

    function setDense(value) {
        dense = value;
        document.cookie = `${DOCUMENTS_DENSITY_COOKIE}=${
            value ? DOCUMENTS_DENSITY_DENSE : DOCUMENTS_DENSITY_DETAILED
        }; path=/; max-age=${DOCUMENTS_DENSITY_MAX_AGE}; SameSite=Lax`;
    }

    // The getter keeps the page reactive: it reads a $state variable, so a click
    // in the header re-renders the controller without a server round trip.
    setContext(DOCUMENTS_DENSITY_CONTEXT, {
        get dense() {
            return dense;
        },
        setDense,
    });

    function isActive(href) {
        return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
    }
</script>

<header class="border-b border-gray-300 bg-white">
    <div class="page px-5 py-2 flex flex-wrap items-center justify-between gap-3">
        <a
            href="/documents"
            class="font-bold text-base no-underline">{m.app_name()}</a
        >
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1">
            {#if onDocumentsList}
                <div class="flex items-center gap-1.5 text-sm text-gray-500">
                    <span>{m.interface_density_label()}</span>
                    <span class="density-segments">
                        <button
                            type="button"
                            aria-pressed={dense}
                            onclick={() => setDense(true)}>{m.interface_density_dense()}</button
                        >
                        <button
                            type="button"
                            aria-pressed={!dense}
                            onclick={() => setDense(false)}>{m.interface_density_detailed()}</button
                        >
                    </span>
                </div>
            {/if}
            <nav>
                <a
                    href="/documents"
                    class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline"
                    class:active={isActive("/documents")}
                    aria-current={isActive("/documents") ? "page" : undefined}>{m.nav_documents()}</a
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
                    href="/mcp/log/"
                    class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline"
                    class:active={isActive("/mcp/log")}
                    aria-current={isActive("/mcp/log") ? "page" : undefined}>{m.nav_mcp_log()}</a
                >
                |
                <a
                    href="/logout"
                    class="text-sm text-gray-500 no-underline hover:text-blue-600 hover:underline">{m.nav_sign_out()}</a
                >
            </nav>
        </div>
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

    .density-segments {
        display: inline-flex;
        border: 1px solid #d1d5db;
        border-radius: 3px;
        overflow: hidden;
    }

    .density-segments button {
        border: 0;
        background: #fff;
        padding: 1px 8px;
        font: inherit;
        color: #4b5563;
        cursor: pointer;
    }

    .density-segments button + button {
        border-left: 1px solid #d1d5db;
    }

    .density-segments button:hover {
        background: #f9fafb;
    }

    .density-segments button[aria-pressed="true"] {
        background: #f3f4f6;
        color: #111827;
        font-weight: 600;
    }

    .density-segments button:focus-visible {
        outline: 2px solid #2563eb;
        outline-offset: -2px;
    }
</style>
