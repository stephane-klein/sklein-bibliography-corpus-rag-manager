<script>
    import { m } from "#lib/paraglide/messages.js";
    import { locales, getLocale, setLocale } from "#lib/paraglide/runtime.js";
    import "uno.css";
    import TechInfoPopup from "#lib/client/TechInfoPopup.svelte";

    let { children } = $props();

    const localeLabels = { en: "English", fr: "Français" };
    const localeTitles = { en: "Switch to English", fr: "Passer en français" };
</script>

<div class="page-wrap">
    <div class="content">
        {@render children()}
    </div>

    <footer class="border-t border-gray-300">
        <div class="page px-5 py-3 text-xs text-gray-500 flex items-center justify-between">
            <nav class="flex items-center gap-1">
                <a
                    href="/docs"
                    class="text-gray-500 no-underline hover:underline">{m.footer_docs()}</a
                >
                |
                <a
                    href="/about"
                    class="text-gray-500 no-underline hover:underline">{m.footer_about()}</a
                >
                |
                <a
                    href="/api/reference"
                    class="text-gray-500 no-underline hover:underline">{m.footer_api()}</a
                >
            </nav>

            <nav class="flex text-sm">
                {#each locales as locale (locale)}
                    {#if locale === getLocale()}
                        <strong>{localeLabels[locale]}</strong>
                    {:else}
                        <button
                            onclick={() => setLocale(locale)}
                            title={localeTitles[locale]}
                            class="bg-transparent border-none cursor-pointer p-0 font-inherit text-inherit hover:underline"
                            >{localeLabels[locale]}</button
                        >
                    {/if}
                    {#if locale !== locales[locales.length - 1]}<span class="ml-0.5"> |</span>
                    {/if}
                {/each}
            </nav>
        </div>
    </footer>

    <div class="metrics-root">
        <TechInfoPopup />
    </div>
</div>

<style>
    .page-wrap {
        position: relative;
        min-height: 100vh;
    }

    .metrics-root {
        position: absolute;
        bottom: 0;
        right: 0;
    }
</style>
