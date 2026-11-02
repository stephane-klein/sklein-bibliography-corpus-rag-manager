<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();
</script>

<svelte:head>
    <title>{m.my_prefs_title()} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-7 tracking-tight">{m.my_prefs_title()}</h1>

    <div class="mb-9">
        <h2 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1.5 border-b border-gray-300">
            {m.my_prefs_section()}
        </h2>

        <form method="POST">
            <div class="mb-3.5">
                <label
                    for="timezone"
                    class="block text-sm font-semibold mb-1">{m.my_prefs_timezone_label()}</label
                >
                <select
                    id="timezone"
                    name="timezone"
                    class="w-full max-w-xs px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                >
                    <option value="UTC">UTC</option>
                    <option
                        value="Europe/Paris"
                        selected>Europe/Paris</option
                    >
                    <option value="America/New_York">America/New_York</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
            </div>

            <div class="mb-3.5">
                <label
                    for="language"
                    class="block text-sm font-semibold mb-1">{m.my_prefs_language_label()}</label
                >
                <select
                    id="language"
                    name="language"
                    class="w-full max-w-40 px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                >
                    <option
                        value="en"
                        selected={data.user.locale === "en"}>English</option
                    >
                    <option
                        value="fr"
                        selected={data.user.locale === "fr"}>Français</option
                    >
                </select>
            </div>

            <div class="flex items-center gap-3 mt-1.5">
                <button
                    type="submit"
                    class="px-4 py-1.5 rounded-sm text-sm font-semibold cursor-pointer border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                >
                    {m.my_prefs_save()}
                </button>
            </div>
        </form>
    </div>
</main>
