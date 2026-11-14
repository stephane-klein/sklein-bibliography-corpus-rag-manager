<script>
    let { data, snippets } = $props();

    const title = "Serveur MCP en lecture seule";
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
                    class="text-gray-500 no-underline hover:text-blue-600 hover:underline">Connexion</a
                >
            {/if}
        </nav>
    </div>
</header>

<main class="page px-5 pt-9 pb-24">
    <h1 class="text-xl font-bold mb-6 tracking-tight">{title}</h1>

    <p class="mb-2">
        Le service expose un serveur Model Context Protocol (MCP) qui permet à un agent IA de lire le corpus
        bibliographique en SQL brut. Il est disponible à l'adresse
        <code class={codeClass}>{snippets.endpoint}</code>.
    </p>

    <h2 class="text-lg font-bold mb-3 mt-6">Lecture seule par conception</h2>
    <p class="mb-2">L'accès est en lecture seule à trois niveaux :</p>
    <ul class="list-disc pl-6 mb-2">
        <li>
            Rôle PostgreSQL : les requêtes utilisent le rôle dédié
            <code class={codeClass}>{data.readerRole}</code>, avec SELECT sur les tables du corpus et rien d'autre.
        </li>
        <li>
            Transaction : chaque requête s'exécute dans une transaction READ ONLY avec un délai d'expiration de 10
            secondes.
        </li>
        <li>
            Authentification HTTP : chaque requête doit porter
            <code class={codeClass}>Authorization: Bearer &lt;your-token&gt;</code>. Créez un jeton dans
            <a
                href="/my/tokens/"
                class="text-blue-600 hover:underline">Jetons MCP</a
            >.
        </li>
    </ul>

    <h2 class="text-lg font-bold mb-3 mt-6">Outil</h2>
    <table class="mb-4 text-sm">
        <thead>
            <tr class="text-left border-b border-gray-300">
                <th class="pr-4 py-1">Outil</th>
                <th class="py-1">Description</th>
            </tr>
        </thead>
        <tbody>
            <tr class="border-b border-gray-200">
                <td class="pr-4 py-1 font-mono">readOnlySqlQuery</td>
                <td class="py-1">
                    Exécute une instruction SQL en lecture seule (SELECT, WITH ... SELECT ou EXPLAIN SELECT) sur le
                    corpus. Accepte la fonction virtuelle
                    <code class={codeClass}>vectorize()</code> pour la recherche vectorielle.
                </td>
            </tr>
            <tr class="border-b border-gray-200">
                <td class="pr-4 py-1 font-mono">semanticSearch</td>
                <td class="py-1">
                    Recherche par sens avec fusion BM25 + vecteur ; renvoie le meilleur passage par document avec les
                    identifiants pour une requête SQL de suivi.
                </td>
            </tr>
        </tbody>
    </table>

    <h2 class="text-lg font-bold mb-3 mt-6">Recherche vectorielle avec readOnlySqlQuery</h2>
    <p class="mb-2">
        Cette fonction n'est disponible que dans les requêtes SQL envoyées à l'outil
        <code class={codeClass}>readOnlySqlQuery</code>. L'outil
        <code class={codeClass}>semanticSearch</code> effectue déjà sa propre recherche vectorielle ; il n'utilise pas
        <code class={codeClass}>vectorize()</code>.
    </p>
    <p class="mb-2">
        <code class={codeClass}>vectorize('some text')</code>
        est une fonction virtuelle. Le serveur MCP remplace chaque appel par un littéral vector avant l'exécution ; PostgreSQL
        ne voit jamais de fonction <code class={codeClass}>vectorize()</code>.
    </p>
    <p class="mb-2">
        L'argument doit être un seul littéral de chaîne. Les colonnes et les expressions sont refusées. Une requête peut
        utiliser au plus {data.maxTexts} textes distincts, avec au plus
        {data.maxChars} caractères chacun.
    </p>
    <p class="mb-2">Exemple :</p>
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-4">{snippets.sqlExample}</pre>

    <h2 class="text-lg font-bold mb-3 mt-6">Tables disponibles</h2>
    {#if data.schema}
        <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-4">{data.schema}</pre>
    {:else}
        <p class="mb-4 text-sm text-gray-500 italic">
            Le schéma est indisponible car le rôle lecteur MCP n'est pas configuré.
        </p>
    {/if}

    <h2 class="text-lg font-bold mb-3 mt-6">Utilisation</h2>
    <p class="mb-2">Lister les outils :</p>
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-2">{snippets.curlList}</pre>
    <p class="mb-4 text-sm text-gray-500">
        Conservez le slash final : /mcp/readonly est redirigé vers /mcp/readonly/, et certains clients MCP ne suivent
        pas une redirection 308 sur un POST.
    </p>

    <h2 class="text-lg font-bold mb-3 mt-6">OpenCode</h2>
    <p class="mb-2">Ajoutez ceci à votre opencode.jsonc :</p>
    <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono mb-4">{snippets.opencodeConfig}</pre>

    <h2 class="text-lg font-bold mb-3 mt-6">Claude Desktop</h2>
    <p class="mb-2">
        Dans Claude Desktop, ouvrez Settings → Connectors → Add custom connector et saisissez l'URL
        <code class={codeClass}>{snippets.endpoint}</code>.
    </p>

    <p class="mt-5 pt-4 border-t border-gray-300 text-sm text-gray-500">
        {#if data.user}
            <a
                href="/mcp/log/"
                class="text-blue-600 hover:underline">Journal d'accès</a
            >
            <span class="text-gray-300">·</span>
        {/if}
        <a
            href={data.user ? "/documents/" : "/login/"}
            class="text-blue-600 hover:underline">{data.user ? "Retour aux documents" : "Connexion"}</a
        >
    </p>
</main>
