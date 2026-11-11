<script>
    import { m } from "#lib/paraglide/messages.js";

    let { data } = $props();

    const endpoint = $derived(`${data.origin}/mcp/readonly/`);

    const opencodeConfig = $derived(
        JSON.stringify(
            {
                mcp: {
                    "bibliography-corpus": {
                        type: "remote",
                        url: endpoint,
                        enabled: true,
                        headers: {
                            Authorization: "Bearer YOUR_MCP_TOKEN",
                        },
                    },
                },
            },
            null,
            2,
        ),
    );

    const curlList = $derived(
        [
            `curl -s -X POST ${endpoint} \\`,
            '    -H "Authorization: Bearer YOUR_MCP_TOKEN" \\',
            '    -H "Content-Type: application/json" \\',
            '    -H "Accept: application/json, text/event-stream" \\',
            `    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`,
        ].join("\n"),
    );

    const sqlExample = $derived(
        [
            "SELECT c.content_node_id,",
            "       n.title,",
            "       c.heading_path,",
            "       left(c.content, 500) AS excerpt,",
            "       c.embedding <=> vectorize('le principe de condorcet') AS distance",
            "  FROM content_chunks c",
            "  JOIN hierarchical_content_nodes n ON n.id = c.content_node_id",
            " WHERE c.embedding IS NOT NULL",
            `   AND c.embedding_model = '${data.embeddingModel ?? "voyage-4"}'`,
            "   AND c.embedding_strategy = 'standard'",
            " ORDER BY distance",
            " LIMIT 10;",
        ].join("\n"),
    );
</script>

<svelte:head>
    <title>{m.mcp_page_title()}</title>
</svelte:head>

<header class="border-b border-gray-300 bg-white">
    <div class="page px-5 py-2 flex items-center justify-between">
        <a
            href={data.user ? "/documents/" : "/login/"}
            class="font-bold text-base no-underline hover:underline">{m.app_name()}</a
        >
        <nav class="text-sm text-gray-500">
            {#if data.user}
                <a
                    href="/documents/"
                    class="text-gray-500 no-underline hover:text-blue-600 hover:underline">{m.mcp_page_documents()}</a
                >
            {:else}
                <a
                    href="/login/"
                    class="text-gray-500 no-underline hover:text-blue-600 hover:underline">{m.mcp_page_signin()}</a
                >
            {/if}
        </nav>
    </div>
</header>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-6 tracking-tight">{m.mcp_page_title()}</h1>

    <p class="mb-2">{m.mcp_page_intro({ endpoint })}</p>

    <h2 class="text-lg font-bold mb-3 mt-6">{m.mcp_page_readonly_title()}</h2>
    <p class="mb-2">{m.mcp_page_readonly_intro()}</p>
    <ul class="list-disc pl-6 mb-2">
        <li>
            {m.mcp_page_readonly_role_before()}
            <code class="bg-gray-100 px-1 py-0.5 rounded-sm">{data.readerRole}</code>{m.mcp_page_readonly_role_after()}
        </li>
        <li>{m.mcp_page_readonly_transaction()}</li>
        <li>
            {m.mcp_page_readonly_auth_before()}
            <code class="bg-gray-100 px-1 py-0.5 rounded-sm">Authorization: Bearer &lt;your-token&gt;</code
            >{m.mcp_page_readonly_auth_after()}
            <a
                href="/my/tokens/"
                class="text-blue-600 hover:underline">{m.mcp_page_tokens()}</a
            >.
        </li>
    </ul>

    <h2 class="text-lg font-bold mb-3 mt-6">{m.mcp_page_tool_title()}</h2>
    <table class="mb-4 text-sm">
        <thead>
            <tr class="text-left border-b border-gray-300">
                <th class="pr-4 py-1">{m.mcp_page_col_tool()}</th>
                <th class="py-1">{m.mcp_page_col_description()}</th>
            </tr>
        </thead>
        <tbody>
            <tr class="border-b border-gray-200">
                <td class="pr-4 py-1 font-mono">readOnlySqlQuery</td>
                <td class="py-1">{m.mcp_page_tool_description()}</td>
            </tr>
        </tbody>
    </table>

    <h2 class="text-lg font-bold mb-3 mt-6">{m.mcp_page_vectorize_title()}</h2>
    <p class="mb-2">
        <code class="bg-gray-100 px-1 py-0.5 rounded-sm">vectorize('some text')</code>
        {m.mcp_page_vectorize_intro()}
    </p>
    <p class="mb-2">
        {m.mcp_page_vectorize_limits({ maxTexts: data.maxTexts, maxChars: data.maxChars })}
    </p>
    <p class="mb-2">{m.mcp_page_vectorize_example()}</p>
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-4">{sqlExample}</pre>

    <h2 class="text-lg font-bold mb-3 mt-6">{m.mcp_page_tables_title()}</h2>
    {#if data.schema}
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-4">{data.schema}</pre>
    {:else}
        <p class="mb-4 text-sm text-gray-500 italic">{m.mcp_page_schema_unavailable()}</p>
    {/if}

    <h2 class="text-lg font-bold mb-3 mt-6">{m.mcp_page_usage_title()}</h2>
    <p class="mb-2">{m.mcp_page_usage_list()}</p>
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-2">{curlList}</pre>
    <p class="mb-4 text-sm text-gray-500">{m.mcp_page_usage_slash()}</p>

    <h2 class="text-lg font-bold mb-3 mt-6">{m.mcp_page_opencode_title()}</h2>
    <p class="mb-2">{m.mcp_page_opencode_intro()}</p>
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-4">{opencodeConfig}</pre>

    <h2 class="text-lg font-bold mb-3 mt-6">{m.mcp_page_claude_title()}</h2>
    <p class="mb-2">{m.mcp_page_claude_intro({ endpoint })}</p>

    <p class="mt-5 pt-4 border-t border-gray-300 text-sm text-gray-500">
        {#if data.user}
            <a
                href="/mcp/log/"
                class="text-blue-600 hover:underline">{m.mcp_page_log()}</a
            >
            <span class="text-gray-300">·</span>
        {/if}
        <a
            href={data.user ? "/documents/" : "/login/"}
            class="text-blue-600 hover:underline">{data.user ? m.mcp_page_back() : m.mcp_page_signin()}</a
        >
    </p>
</main>
