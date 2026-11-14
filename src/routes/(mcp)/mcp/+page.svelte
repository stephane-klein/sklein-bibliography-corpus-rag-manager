<script>
    import { getLocale } from "#lib/paraglide/runtime.js";

    import PageEn from "./page.en.svelte";
    import PageFr from "./page.fr.svelte";

    let { data } = $props();

    const endpoint = $derived(`${data.origin}/mcp/readonly/`);

    const snippets = $derived({
        endpoint,
        opencodeConfig: JSON.stringify(
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
        curlList: [
            `curl -s -X POST ${endpoint} \\`,
            '    -H "Authorization: Bearer YOUR_MCP_TOKEN" \\',
            '    -H "Content-Type: application/json" \\',
            '    -H "Accept: application/json, text/event-stream" \\',
            `    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`,
        ].join("\n"),
        sqlExample: [
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
    });
</script>

{#if getLocale() === "fr"}
    <PageFr
        {data}
        {snippets}
    />
{:else}
    <PageEn
        {data}
        {snippets}
    />
{/if}
