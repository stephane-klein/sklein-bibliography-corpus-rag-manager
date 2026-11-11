import { sql } from "#lib/server/pg.js";
import { embedTexts, getEmbeddingInfo, getEmbeddingModel } from "#lib/server/embedding.js";
import { logger } from "#lib/server/logger.js";
import { buildQueryEmbeddingKey, readQueryEmbedding, writeQueryEmbedding } from "#lib/server/query-embedding-cache.js";

const PAGE_SIZE = 15;
const CANDIDATE_LIMIT = 200;
const RRF_K = 60;
const QUERY_TIMEOUT_MS = 3_000;
const BEST_CHUNK_CHARS = 400;

export async function searchDocuments({ q, authorWords, titleWords, semantic, requestedPage }) {
    const filterConditions = [
        authorWords.length > 0 ? allWords(sql`immutable_unaccent(immutable_authors_text(authors))`, authorWords) : null,
        titleWords.length > 0 ? allWords(sql`immutable_unaccent(title)`, titleWords) : null,
    ].filter((condition) => condition !== null);
    const filtered = filterConditions.length > 0;

    const [{ total: corpusTotal }] = await sql`
        SELECT count(*)::int AS total
          FROM hierarchical_content_nodes
    `;
    const selectionRows = filtered
        ? await sql`
              SELECT count(*)::int AS total
                FROM hierarchical_content_nodes
                ${whereClause(filterConditions)}
          `
        : [{ total: corpusTotal }];
    const selectionTotal = selectionRows[0].total;

    if (!q) {
        const embeddingModel = getEmbeddingModel();
        const { page, totalPages, offset } = pageWindow(selectionTotal, requestedPage);
        const documents = await sql`
            SELECT n.nanoid, n.title, n.authors, n.original_published_date, n.source_url,
                   COALESCE(chunks.total, 0) AS chunk_count,
                   COALESCE(chunks.ready, 0) AS ready_chunk_count,
                   COALESCE(chunks.embedded, 0) AS embedded_chunk_count
              FROM hierarchical_content_nodes n
              LEFT JOIN LATERAL (
                  SELECT count(*)::int AS total,
                         count(*) FILTER (
                             WHERE c.embedding IS NOT NULL
                               AND c.embedding_model = ${embeddingModel}
                               AND c.embedding_strategy = 'standard'
                         )::int AS ready,
                         count(*) FILTER (WHERE c.embedding IS NOT NULL)::int AS embedded
                    FROM content_chunks c
                   WHERE c.content_node_id = n.id
              ) chunks ON true
              ${whereClause(filterConditions)}
             ORDER BY n.original_published_date DESC NULLS LAST, n.id DESC
             LIMIT ${PAGE_SIZE} OFFSET ${offset}
        `;

        return {
            documents: attachVectorization(documents),
            embeddingModel,
            page,
            total: selectionTotal,
            totalPages,
            corpusTotal,
            selectionTotal,
            filtered,
            hasQuery: false,
            semantic,
            hybrid: false,
            semanticError: null,
            semanticMeta: null,
        };
    }

    let semanticError = null;
    let semanticMeta = null;

    if (semantic) {
        try {
            const result = await hybridSearch({
                q,
                filterConditions,
                requestedPage,
                corpusTotal,
                selectionTotal,
                filtered,
            });

            if (result.hybrid) {
                return result;
            }

            semanticMeta = result.semanticMeta;
            semanticError = "no-vectors";
        } catch (error) {
            logger.warn({ err: error, query: error.query }, "Hybrid search failed; falling back to BM25");
            semanticError = "unavailable";
        }
    }

    return await bm25Search({
        q,
        filterConditions,
        requestedPage,
        corpusTotal,
        selectionTotal,
        filtered,
        semantic,
        semanticError,
        semanticMeta,
    });
}

export async function getQueryEmbedding(query) {
    const info = getEmbeddingInfo();
    const key = buildQueryEmbeddingKey(query, info);
    const cached = await readQueryEmbedding(key);

    if (cached) {
        return { embedding: cached, source: "cache", usage: null };
    }

    const { embeddings, usage } = await embedTexts([query], {
        inputType: "query",
        timeoutMs: QUERY_TIMEOUT_MS,
    });
    await writeQueryEmbedding(key, embeddings[0]);

    return { embedding: embeddings[0], source: "provider", usage };
}

async function hybridSearch({ q, filterConditions, requestedPage, corpusTotal, selectionTotal, filtered }) {
    const info = getEmbeddingInfo();
    const { embedding, source, usage } = await getQueryEmbedding(q);
    const vector = JSON.stringify(embedding);
    const semanticMeta = {
        source,
        tokens: usage?.tokens ?? null,
        costUsd: usage?.cost_usd ?? null,
    };

    const [bm25Docs, vectorRows] = await Promise.all([
        sql`
            SELECT id, nanoid, title, authors, original_published_date, source_url
              FROM hierarchical_content_nodes
              ${whereClause([sql`content @@@ pdb.parse(${q}, lenient => true)`, ...filterConditions])}
             ORDER BY pdb.score(id) DESC, id ASC
             LIMIT ${CANDIDATE_LIMIT}
        `,
        sql`
            SELECT c.content_node_id AS id,
                   n.nanoid,
                   n.title,
                   n.authors,
                   n.original_published_date,
                   n.source_url,
                   c.heading_path,
                   left(c.content, ${BEST_CHUNK_CHARS + 1}) AS best_chunk,
                   length(c.content) > ${BEST_CHUNK_CHARS} AS best_chunk_truncated,
                   c.chunk_index,
                   c.embedding <=> ${vector}::vector AS distance
              FROM content_chunks c
              JOIN hierarchical_content_nodes n ON n.id = c.content_node_id
              ${whereClause([
                  sql`c.embedding IS NOT NULL`,
                  sql`c.embedding_model = ${info.model}`,
                  sql`c.embedding_strategy = 'standard'`,
                  ...filterConditions,
              ])}
             ORDER BY c.embedding <=> ${vector}::vector
             LIMIT ${CANDIDATE_LIMIT}
        `,
    ]);

    if (vectorRows.length === 0) {
        return { hybrid: false, semanticMeta };
    }

    const fused = fuseRrf(bm25Docs, groupVectorRows(vectorRows));
    const { page, totalPages, offset } = pageWindow(fused.length, requestedPage);
    const pageDocuments = fused.slice(offset, offset + PAGE_SIZE);
    const documents = await attachSnippets(pageDocuments, q);

    return {
        documents,
        page,
        total: fused.length,
        totalPages,
        corpusTotal,
        selectionTotal,
        filtered,
        hasQuery: true,
        semantic: true,
        hybrid: true,
        semanticError: null,
        semanticMeta,
    };
}

async function bm25Search({
    q,
    filterConditions,
    requestedPage,
    corpusTotal,
    selectionTotal,
    filtered,
    semantic,
    semanticError,
    semanticMeta = null,
}) {
    const matchConditions = [sql`content @@@ pdb.parse(${q}, lenient => true)`, ...filterConditions];
    const [{ total }] = await sql`
        SELECT count(*)::int AS total
          FROM hierarchical_content_nodes
          ${whereClause(matchConditions)}
    `;
    const { page, totalPages, offset } = pageWindow(total, requestedPage);
    const documents = (
        await sql`
            SELECT nanoid,
                   title,
                   authors,
                   original_published_date,
                   source_url,
                   pdb.snippets(
                       content,
                       max_num_chars => 200,
                       start_tag => '<mark>',
                       end_tag => '</mark>',
                       "limit" => 3
                   ) AS snippets
              FROM hierarchical_content_nodes
              ${whereClause(matchConditions)}
             ORDER BY pdb.score(id) DESC, id ASC
             LIMIT ${PAGE_SIZE} OFFSET ${offset}
        `
    ).map((document, index) => ({ ...document, bm25Rank: offset + index + 1 }));

    return {
        documents,
        page,
        total,
        totalPages,
        corpusTotal,
        selectionTotal,
        filtered,
        hasQuery: true,
        semantic,
        hybrid: false,
        semanticError,
        semanticMeta,
    };
}

function groupVectorRows(rows) {
    const documents = new Map();

    for (const row of rows) {
        if (documents.has(row.id)) {
            continue;
        }

        documents.set(row.id, {
            id: row.id,
            nanoid: row.nanoid,
            title: row.title,
            authors: row.authors,
            original_published_date: row.original_published_date,
            source_url: row.source_url,
            bestChunk: {
                heading_path: row.heading_path,
                content: bestChunkExcerpt(row.best_chunk, row.best_chunk_truncated),
            },
            distance: Number(row.distance),
        });
    }

    return Array.from(documents.values());
}

// Cut the list excerpt at the last complete word so no result shows half a word.
function bestChunkExcerpt(text, truncated) {
    if (!truncated) {
        return text;
    }

    const excerpt = text.slice(0, BEST_CHUNK_CHARS).replace(/\s+\S*$/, "");

    return `${excerpt}…`;
}

function fuseRrf(bm25Docs, vectorDocs) {
    const fused = new Map();

    bm25Docs.forEach((document, index) => {
        fused.set(document.id, {
            ...document,
            bm25Rank: index + 1,
            vectorRank: null,
            rrf: 1 / (RRF_K + index + 1),
        });
    });

    vectorDocs.forEach((document, index) => {
        const existing = fused.get(document.id);

        if (existing) {
            existing.rrf += 1 / (RRF_K + index + 1);
            existing.bestChunk = document.bestChunk;
            existing.vectorRank = index + 1;
        } else {
            fused.set(document.id, {
                ...document,
                bm25Rank: null,
                vectorRank: index + 1,
                rrf: 1 / (RRF_K + index + 1),
            });
        }
    });

    return Array.from(fused.values()).sort((left, right) => right.rrf - left.rrf || left.id - right.id);
}

// pdb.snippets() only runs inside a ParadeDB scan. The ids come from the BM25
// candidate list, so repeating the match condition changes no result: it gives
// ParadeDB the scan it requires.
async function attachSnippets(documents, q) {
    const ids = documents.filter((document) => !document.bestChunk).map((document) => document.id);

    if (ids.length === 0) {
        return documents.map((document) => ({ ...document, snippets: [] }));
    }

    const rows = await sql`
        SELECT id,
               pdb.snippets(
                   content,
                   max_num_chars => 200,
                   start_tag => '<mark>',
                   end_tag => '</mark>',
                   "limit" => 3
               ) AS snippets
          FROM hierarchical_content_nodes
         WHERE id IN ${sql(ids)}
           AND content @@@ pdb.parse(${q}, lenient => true)
    `;
    const snippetsById = new Map(rows.map((row) => [row.id, row.snippets]));

    return documents.map((document) => ({
        ...document,
        snippets: snippetsById.get(document.id) ?? [],
    }));
}

// Mirrors the conditions hybrid search applies to content_chunks, so the
// indicator means "the semantic search can use this document" and not merely
// "a vector exists".
function vectorizationState(row) {
    const chunks = row.chunk_count;
    const ready = row.ready_chunk_count;

    if (chunks === 0) {
        return "none";
    }

    if (ready === chunks) {
        return "ready";
    }

    if (ready > 0) {
        return "partial";
    }

    return row.embedded_chunk_count === 0 ? "pending" : "stale";
}

function attachVectorization(documents) {
    return documents.map((document) => ({ ...document, vectorization: vectorizationState(document) }));
}

function pageWindow(total, requestedPage) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const page = totalPages > 0 ? Math.min(Math.max(1, requestedPage || 1), totalPages) : 1;

    return { page, totalPages, offset: (page - 1) * PAGE_SIZE };
}

function allWords(column, words) {
    return words.map((word) => ilikeCondition(column, word)).reduce((acc, condition) => sql`${acc} AND ${condition}`);
}

function ilikeCondition(column, word) {
    return sql`${column} ILIKE '%' || immutable_unaccent(${escapeLike(word)}) || '%'`;
}

function escapeLike(word) {
    return word.replace(/[\\%_]/g, "\\$&");
}

function whereClause(conditions) {
    return conditions.length > 0
        ? sql`WHERE ${conditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}`
        : sql``;
}
