<script>
    let { data, snippets } = $props();

    const title = "MCP read-only server";
    const codeClass = "bg-gray-100 px-1 py-0.5 rounded-sm";
</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>

<header class="border-b border-gray-300 bg-white">
    <div class="page px-5 py-2 flex items-center justify-between">
        <a
            href={data.user ? "/documents/" : "/login/"}
            class="font-bold text-base no-underline hover:underline">Sklein Bibliography Corpus RAG Manager</a
        >
        <nav class="text-sm text-gray-500">
            {#if data.user}
                <a
                    href="/documents/"
                    class="text-gray-500 no-underline hover:text-blue-600 hover:underline">Documents</a
                >
            {:else}
                <a
                    href="/login/"
                    class="text-gray-500 no-underline hover:text-blue-600 hover:underline">Sign in</a
                >
            {/if}
        </nav>
    </div>
</header>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-6 tracking-tight">{title}</h1>

    <p class="mb-2">
        The service exposes a Model Context Protocol (MCP) server that lets an AI agent read the bibliography corpus
        over raw SQL. It is available at
        <code class={codeClass}>{snippets.endpoint}</code>.
    </p>

    <h2 class="text-lg font-bold mb-3 mt-6">Read-only by design</h2>
    <p class="mb-2">Access is read-only at three levels:</p>
    <ul class="list-disc pl-6 mb-2">
        <li>
            Database role: queries run as the dedicated PostgreSQL role
            <code class={codeClass}>{data.readerRole}</code>, with SELECT on the corpus tables and nothing else.
        </li>
        <li>Transaction: every query runs inside a READ ONLY transaction with a 10-second statement timeout.</li>
        <li>
            HTTP authentication: every request must carry
            <code class={codeClass}>Authorization: Bearer &lt;your-token&gt;</code>. Create a token in
            <a
                href="/my/tokens/"
                class="text-blue-600 hover:underline">MCP tokens</a
            >.
        </li>
    </ul>

    <h2 class="text-lg font-bold mb-3 mt-6">Tool</h2>
    <table class="mb-4 text-sm">
        <thead>
            <tr class="text-left border-b border-gray-300">
                <th class="pr-4 py-1">Tool</th>
                <th class="py-1">Description</th>
            </tr>
        </thead>
        <tbody>
            <tr class="border-b border-gray-200">
                <td class="pr-4 py-1 font-mono">readOnlySqlQuery</td>
                <td class="py-1">
                    Execute one read-only SQL statement (SELECT, WITH ... SELECT or EXPLAIN SELECT) against the corpus.
                    Accepts the virtual
                    <code class={codeClass}>vectorize()</code> function for vector search.
                </td>
            </tr>
            <tr class="border-b border-gray-200">
                <td class="pr-4 py-1 font-mono">semanticSearch</td>
                <td class="py-1">
                    Search by meaning with BM25 + vector fusion; returns the best passage per document with identifiers
                    for follow-up SQL.
                </td>
            </tr>
        </tbody>
    </table>

    <h2 class="text-lg font-bold mb-3 mt-6">Vector search with readOnlySqlQuery</h2>
    <p class="mb-2">
        This function is only available in SQL queries sent to the
        <code class={codeClass}>readOnlySqlQuery</code> tool. The
        <code class={codeClass}>semanticSearch</code> tool already performs its own vector search; it does not use
        <code class={codeClass}>vectorize()</code>.
    </p>
    <p class="mb-2">
        <code class={codeClass}>vectorize('some text')</code>
        is a virtual function. The MCP server replaces each call with a vector literal before execution; PostgreSQL never
        sees a <code class={codeClass}>vectorize()</code> function.
    </p>
    <p class="mb-2">
        The argument must be one string literal. Column references and expressions are rejected. A query can use at most {data.maxTexts}
        distinct texts, with at most {data.maxChars} characters each.
    </p>
    <p class="mb-2">Example:</p>
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-4">{snippets.sqlExample}</pre>

    <h2 class="text-lg font-bold mb-3 mt-6">Available tables</h2>
    {#if data.schema}
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-4">{data.schema}</pre>
    {:else}
        <p class="mb-4 text-sm text-gray-500 italic">
            The schema is unavailable because the MCP reader role is not configured.
        </p>
    {/if}

    <h2 class="text-lg font-bold mb-3 mt-6">Usage</h2>
    <p class="mb-2">List the tools:</p>
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-2">{snippets.curlList}</pre>
    <p class="mb-4 text-sm text-gray-500">
        Keep the trailing slash: /mcp/readonly is redirected to /mcp/readonly/, and some MCP clients do not follow a 308
        redirect on POST.
    </p>

    <h2 class="text-lg font-bold mb-3 mt-6">OpenCode</h2>
    <p class="mb-2">Add this to your opencode.jsonc:</p>
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-4">{snippets.opencodeConfig}</pre>

    <h2 class="text-lg font-bold mb-3 mt-6">Claude Desktop</h2>
    <p class="mb-2">
        In Claude Desktop, open Settings → Connectors → Add custom connector and enter the URL
        <code class={codeClass}>{snippets.endpoint}</code>.
    </p>

    <p class="mt-5 pt-4 border-t border-gray-300 text-sm text-gray-500">
        {#if data.user}
            <a
                href="/mcp/log/"
                class="text-blue-600 hover:underline">Access log</a
            >
            <span class="text-gray-300">·</span>
        {/if}
        <a
            href={data.user ? "/documents/" : "/login/"}
            class="text-blue-600 hover:underline">{data.user ? "Back to documents" : "Sign in"}</a
        >
    </p>
</main>
