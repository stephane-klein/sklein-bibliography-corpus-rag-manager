<script>
    import { m } from "#lib/paraglide/messages.js";

    let { form, data } = $props();

    function isExpired(token) {
        return token.expires_at && new Date(token.expires_at).getTime() <= Date.now();
    }

    function errorMessage(key) {
        if (key === "name_required") return m.my_tokens_name_required();
        if (key === "expiration_invalid") return m.my_tokens_expiration_error();
        return key;
    }

    function confirmRevoke(e) {
        if (!confirm(m.my_tokens_revoke_confirm())) {
            e.preventDefault();
        }
    }
</script>

<svelte:head>
    <title>{m.my_tokens_title()} — {m.app_name()}</title>
</svelte:head>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-7 tracking-tight">{m.my_tokens_title()}</h1>

    {#if form?.created && form?.raw}
        <div class="mb-6 max-w-lg">
            <h2 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
                {m.my_tokens_created_section()}
            </h2>
            <p class="text-xs text-gray-500 mb-2">{m.my_tokens_created_desc()}</p>
            <pre
                class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-sm text-sm font-mono break-all">{form.raw}</pre>
        </div>
    {/if}

    {#if form?.deleted}
        <p class="text-sm text-green-700 mb-3.5">{m.my_tokens_deleted()}</p>
    {/if}

    {#if form?.errorKey}
        <p class="text-sm text-red-600 mb-3.5">{errorMessage(form.errorKey)}</p>
    {/if}

    <div class="mb-9">
        <h2 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1.5 border-b border-gray-300">
            {m.my_tokens_create_section()}
        </h2>

        <form
            method="POST"
            action="?/create"
            class="max-w-sm"
        >
            <div class="mb-3">
                <label
                    for="name"
                    class="block text-sm font-semibold mb-1">{m.my_tokens_name_label()}</label
                >
                <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder={m.my_tokens_name_placeholder()}
                    required
                    class="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                />
            </div>
            <div class="mb-3">
                <label
                    for="expiresInDays"
                    class="block text-sm font-semibold mb-1">{m.my_tokens_expiration_label()}</label
                >
                <input
                    type="number"
                    id="expiresInDays"
                    name="expiresInDays"
                    min="1"
                    placeholder={m.my_tokens_expiration_placeholder()}
                    class="w-full px-2 py-1.5 border border-gray-300 rounded-sm text-sm text-gray-900 bg-white focus:outline-2 focus:outline-blue-600 focus:border-blue-600"
                />
            </div>
            <button
                type="submit"
                class="px-4 py-1.5 rounded-sm text-sm font-semibold cursor-pointer border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
            >
                {m.my_tokens_create_button()}
            </button>
        </form>
    </div>

    <div>
        <h2 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 pb-1.5 border-b border-gray-300">
            {m.my_tokens_your_tokens()}
        </h2>

        {#if data.tokens.length === 0}
            <p class="text-sm text-gray-500 italic">{m.my_tokens_empty()}</p>
        {:else}
            <table class="w-full text-sm border-collapse">
                <thead>
                    <tr>
                        <th
                            class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 border-b border-gray-300 pr-2"
                            >{m.my_tokens_column_name()}</th
                        >
                        <th
                            class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 border-b border-gray-300 pr-2"
                            >{m.my_tokens_column_created()}</th
                        >
                        <th
                            class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 border-b border-gray-300 pr-2"
                            >{m.my_tokens_column_last_used()}</th
                        >
                        <th
                            class="text-left text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 border-b border-gray-300 pr-2"
                            >{m.my_tokens_column_expires()}</th
                        >
                        <th
                            class="text-right text-xs font-bold uppercase tracking-wider text-gray-500 pb-1.5 border-b border-gray-300"
                        ></th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.tokens as token (token.id)}
                        <tr>
                            <td class="py-1.5 pr-2 border-b border-gray-200 {isExpired(token) ? 'text-gray-400' : ''}"
                                >{token.name}</td
                            >
                            <td class="py-1.5 pr-2 border-b border-gray-200 text-gray-500 text-xs"
                                >{new Date(token.created_at).toLocaleDateString()}</td
                            >
                            <td class="py-1.5 pr-2 border-b border-gray-200 text-gray-500 text-xs"
                                >{token.last_used ? new Date(token.last_used).toLocaleDateString() : "—"}</td
                            >
                            <td
                                class="py-1.5 pr-2 border-b border-gray-200 text-xs {isExpired(token)
                                    ? 'text-red-600 font-semibold'
                                    : 'text-gray-500'}"
                            >
                                {#if token.expires_at}
                                    {new Date(token.expires_at).toLocaleDateString()}
                                    {#if isExpired(token)}· {m.my_tokens_expired()}{/if}
                                {:else}
                                    {m.my_tokens_never_expires()}
                                {/if}
                            </td>
                            <td class="py-1.5 border-b border-gray-200 text-right">
                                <form
                                    method="POST"
                                    action="?/delete"
                                    onsubmit={confirmRevoke}
                                >
                                    <input
                                        type="hidden"
                                        name="id"
                                        value={token.id}
                                    />
                                    <button
                                        type="submit"
                                        class="text-xs text-red-600 bg-transparent border-none cursor-pointer hover:underline"
                                    >
                                        {m.my_tokens_revoke()}
                                    </button>
                                </form>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</main>
