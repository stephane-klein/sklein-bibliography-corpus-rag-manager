import { sql } from "#lib/server/pg.js";
import { embedTexts, getEmbeddingInfo, getEmbeddingModel } from "#lib/server/embedding.js";
import { logger } from "#lib/server/logger.js";
import { buildQueryEmbeddingKey, readQueryEmbedding, writeQueryEmbedding } from "#lib/server/query-embedding-cache.js";
import { classifySemanticError } from "#lib/server/search-diagnostics.js";
import { sectionVectorizationState } from "#lib/server/vectorization.js";

const PAGE_SIZE = 15;
const CANDIDATE_LIMIT = 200;
const RRF_K = 60;
const QUERY_TIMEOUT_MS = 3_000;
const BEST_CHUNK_CHARS = 400;

export async function searchDocuments({
    q,
    authorWords = [],
    authorNames = [],
    titleWords,
    semantic,
    requestedPage,
    pageSize = PAGE_SIZE,
}) {
    const effectivePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : PAGE_SIZE;
    const filterConditions = [
        authorWords.length > 0 ? allWords(sql`immutable_unaccent(immutable_authors_text(authors))`, authorWords) : null,
        authorNames.length > 0 ? anyAuthorCondition(authorNames) : null,
        titleWords.length > 0 ? allWords(sql`immutable_unaccent(title)`, titleWords) : null,
    ].filter((condition) => condition !== null);
    const filtered = filterConditions.length > 0;

    const [{ total: corpusTotal, roots: rootTotal }] = await sql`
        SELECT count(*)::int AS total,
               count(*) FILTER (WHERE parent_id IS NULL)::int AS roots
          FROM hierarchical_content_nodes
    `;
    const selectionCounts = filtered
        ? await sql`
              SELECT count(*)::int AS total,
                     count(*) FILTER (WHERE parent_id IS NULL)::int AS roots
                FROM hierarchical_content_nodes
                ${whereClause(filterConditions)}
          `
        : [{ total: corpusTotal, roots: rootTotal }];
    const selectionTotal = selectionCounts[0].total;
    const rootSelectionTotal = selectionCounts[0].roots;

    if (!q) {
        const embeddingModel = getEmbeddingModel();
        const { page, totalPages, offset } = pageWindow(rootSelectionTotal, requestedPage, effectivePageSize);
        const documents = await sql`
            SELECT n.nanoid, n.title, n.authors, n.original_published_date, n.source_url,
                   n.source_kind,
                   CASE WHEN n.markdown_source_file IS NULL THEN 'book' ELSE 'document' END AS kind,
                   COALESCE(chunks.chapter_count, 0) AS chapter_count,
                   COALESCE(chunks.ready_chapter_count, 0) AS ready_chapter_count,
                   COALESCE(chunks.chunk_count, 0) AS chunk_count,
                   COALESCE(chunks.ready_chunk_count, 0) AS ready_chunk_count,
                   COALESCE(chunks.embedded_chunk_count, 0) AS embedded_chunk_count
              FROM hierarchical_content_nodes n
              LEFT JOIN LATERAL (
                  WITH RECURSIVE subtree AS (
                      SELECT id, markdown_source_file
                        FROM hierarchical_content_nodes
                       WHERE id = n.id
                      UNION ALL
                      SELECT child.id, child.markdown_source_file
                        FROM hierarchical_content_nodes child
                        JOIN subtree ON child.parent_id = subtree.id
                  ),
                  chapter_stats AS (
                      SELECT subtree.id,
                             count(c.id)::int AS chunk_count,
                             count(c.id) FILTER (
                                 WHERE c.embedding IS NOT NULL
                                   AND c.embedding_model = ${embeddingModel}
                                   AND c.embedding_strategy = 'standard'
                             )::int AS ready_chunk_count,
                             count(c.id) FILTER (WHERE c.embedding IS NOT NULL)::int AS embedded_chunk_count
                        FROM subtree
                        LEFT JOIN content_chunks c ON c.content_node_id = subtree.id
                       WHERE subtree.markdown_source_file IS NOT NULL
                       GROUP BY subtree.id
                  )
                  SELECT count(*)::int AS chapter_count,
                         count(*) FILTER (
                             WHERE chunk_count > 0 AND ready_chunk_count = chunk_count
                         )::int AS ready_chapter_count,
                         COALESCE(sum(chunk_count), 0)::int AS chunk_count,
                         COALESCE(sum(ready_chunk_count), 0)::int AS ready_chunk_count,
                         COALESCE(sum(embedded_chunk_count), 0)::int AS embedded_chunk_count
                    FROM chapter_stats
              ) chunks ON true
              ${whereClause([sql`n.parent_id IS NULL`, ...filterConditions])}
             ORDER BY n.original_published_date DESC NULLS LAST, n.id DESC
             LIMIT ${effectivePageSize} OFFSET ${offset}
        `;

        return {
            documents: attachVectorization(documents),
            embeddingModel,
            page,
            total: rootSelectionTotal,
            totalPages,
            corpusTotal: rootTotal,
            selectionTotal: rootSelectionTotal,
            filtered,
            hasQuery: false,
            semantic,
            hybrid: false,
            semanticError: null,
            semanticMeta: null,
            diagnostics: null,
        };
    }

    let semanticError = null;
    let semanticMeta = null;
    let semanticDiagnostics = null;

    if (semantic) {
        try {
            const result = await hybridSearch({
                q,
                filterConditions,
                requestedPage,
                pageSize: effectivePageSize,
                corpusTotal,
                selectionTotal,
                filtered,
            });

            if (result.hybrid) {
                return result;
            }

            semanticMeta = result.semanticMeta;
            semanticError = result.semanticError ?? "no-matches";
            semanticDiagnostics = result.diagnostics ?? null;
        } catch (error) {
            logger.warn({ err: error, query: error.query }, "Hybrid search failed; falling back to BM25");
            semanticError = "unavailable";
            semanticDiagnostics = null;
        }
    }

    return await bm25Search({
        q,
        filterConditions,
        requestedPage,
        pageSize: effectivePageSize,
        corpusTotal,
        selectionTotal,
        filtered,
        semantic,
        semanticError,
        semanticMeta,
        diagnostics: semanticDiagnostics,
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

// Authors of the documents the page lists, so the picker offers names that
// actually match a root node. Chapter authors repeat the book authors, so they
// would add no choice here.
export async function listDocumentAuthors() {
    const rows = await sql`
        SELECT a AS name
          FROM hierarchical_content_nodes
          CROSS JOIN LATERAL unnest(authors) AS a
         WHERE parent_id IS NULL
           AND a <> ''
         GROUP BY a
         ORDER BY immutable_unaccent(a), a
    `;

    return rows.map((row) => row.name);
}

async function hybridSearch({ q, filterConditions, requestedPage, pageSize, corpusTotal, selectionTotal, filtered }) {
    const info = getEmbeddingInfo();
    const embeddingStartedAt = performance.now();
    const { embedding, source, usage } = await getQueryEmbedding(q);
    const vector = JSON.stringify(embedding);
    const semanticMeta = {
        source,
        tokens: usage?.tokens ?? null,
        costUsd: usage?.cost_usd ?? null,
        embeddingMs: Math.round(performance.now() - embeddingStartedAt),
        model: info.query_model,
    };

    const [bm25Docs, vectorRows] = await Promise.all([
        sql`
            SELECT id, nanoid, title, authors, original_published_date, source_url, source_kind
              FROM hierarchical_content_nodes
              ${whereClause([bm25Condition(q), ...filterConditions])}
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
                   n.source_kind,
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
        const [{ total: corpusVectors }] = await sql`
            SELECT count(*)::int AS total
              FROM content_chunks
             WHERE embedding IS NOT NULL
               AND embedding_model = ${info.model}
               AND embedding_strategy = 'standard'
        `;

        return {
            hybrid: false,
            semanticMeta,
            semanticError: classifySemanticError({ corpusVectors, filtered, vectorCount: vectorRows.length }),
            diagnostics: {
                corpus_vectors: corpusVectors,
                filtered_vectors: 0,
                selection_total: selectionTotal,
                corpus_total: corpusTotal,
            },
        };
    }

    const fused = fuseRrf(bm25Docs, groupVectorRows(vectorRows));
    const { page, totalPages, offset } = pageWindow(fused.length, requestedPage, pageSize);
    const pageDocuments = fused.slice(offset, offset + pageSize);
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
        diagnostics: {
            vector_candidates: vectorRows.length,
            selection_total: selectionTotal,
            corpus_total: corpusTotal,
        },
    };
}

async function bm25Search({
    q,
    filterConditions,
    requestedPage,
    pageSize,
    corpusTotal,
    selectionTotal,
    filtered,
    semantic,
    semanticError,
    semanticMeta = null,
    diagnostics = null,
}) {
    const matchConditions = [bm25Condition(q), ...filterConditions];
    const [{ total }] = await sql`
        SELECT count(*)::int AS total
          FROM hierarchical_content_nodes
          ${whereClause(matchConditions)}
    `;
    const { page, totalPages, offset } = pageWindow(total, requestedPage, pageSize);
    const documents = (
        await sql`
            SELECT id,
                   nanoid,
                   title,
                   authors,
                   original_published_date,
                   source_url,
                   source_kind,
                   pdb.snippets(
                       content_fr,
                       max_num_chars => 200,
                       start_tag => '<mark>',
                       end_tag => '</mark>',
                       "limit" => 3
                   ) AS snippets_fr,
                   pdb.snippets(
                       content_en,
                       max_num_chars => 200,
                       start_tag => '<mark>',
                       end_tag => '</mark>',
                       "limit" => 3
                   ) AS snippets_en
              FROM hierarchical_content_nodes
              ${whereClause(matchConditions)}
             ORDER BY pdb.score(id) DESC, id ASC
             LIMIT ${pageSize} OFFSET ${offset}
        `
    ).map(({ snippets_fr, snippets_en, ...document }, index) => ({
        ...document,
        snippets: [...(snippets_fr ?? []), ...(snippets_en ?? [])],
        bm25Rank: offset + index + 1,
    }));

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
        diagnostics,
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
            source_kind: row.source_kind,
            bestChunk: {
                heading_path: row.heading_path,
                chunk_index: row.chunk_index,
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
                   content_fr,
                   max_num_chars => 200,
                   start_tag => '<mark>',
                   end_tag => '</mark>',
                   "limit" => 3
               ) AS snippets_fr,
               pdb.snippets(
                   content_en,
                   max_num_chars => 200,
                   start_tag => '<mark>',
                   end_tag => '</mark>',
                   "limit" => 3
               ) AS snippets_en
          FROM hierarchical_content_nodes
         WHERE id IN ${sql(ids)}
           AND ${bm25Condition(q)}
    `;
    const snippetsById = new Map(rows.map((row) => [row.id, [...(row.snippets_fr ?? []), ...(row.snippets_en ?? [])]]));

    return documents.map((document) => ({
        ...document,
        snippets: snippetsById.get(document.id) ?? [],
    }));
}

// Mirrors the conditions hybrid search applies to content_chunks, so the
// indicator means "the semantic search can use this document" and not merely
// "a vector exists".
function vectorizationState(row) {
    const chapters = row.chapter_count;
    const readyChapters = row.ready_chapter_count;
    const chunks = row.chunk_count;
    const ready = row.ready_chunk_count;

    // A single document is one section, so its own chunk counts decide. A
    // section with no chunk reports "none" instead of "pending", which keeps
    // the old "—" of the list.
    if (row.kind === "document") {
        return sectionVectorizationState({
            chunkCount: chunks,
            readyChunkCount: ready,
            embeddedChunkCount: row.embedded_chunk_count,
        });
    }

    // A book with chapters but no chunks is reported as pending, so a missing
    // sidecar is visible instead of being hidden by an empty denominator.
    if (chapters === 0) {
        return "none";
    }

    if (readyChapters === chapters && ready === chunks) {
        return "ready";
    }

    if (ready > 0) {
        return "partial";
    }

    return row.embedded_chunk_count === 0 ? "pending" : "stale";
}

function attachVectorization(documents) {
    return documents.map((document) => ({
        ...document,
        vectorization: vectorizationState(document),
        vectorizationStats: {
            chapterCount: document.chapter_count,
            readyChapterCount: document.ready_chapter_count,
            chunkCount: document.chunk_count,
            readyChunkCount: document.ready_chunk_count,
        },
    }));
}

function pageWindow(total, requestedPage, pageSize = PAGE_SIZE) {
    const totalPages = Math.ceil(total / pageSize);
    const page = totalPages > 0 ? Math.min(Math.max(1, requestedPage || 1), totalPages) : 1;

    return { page, totalPages, offset: (page - 1) * pageSize };
}

function allWords(column, words) {
    return words.map((word) => ilikeCondition(column, word)).reduce((acc, condition) => sql`${acc} AND ${condition}`);
}

// The picker sends full author names. A document matches when one of its
// authors equals one of them, ignoring case and accents; the selected authors
// are alternatives, not requirements.
function anyAuthorCondition(names) {
    return names
        .map(
            (name) => sql`EXISTS (
                SELECT 1
                  FROM unnest(authors) AS author
                 WHERE lower(immutable_unaccent(author)) = lower(immutable_unaccent(${name}))
            )`,
        )
        .reduce((acc, condition) => sql`${acc} OR ${condition}`);
}

function ilikeCondition(column, word) {
    return sql`${column} ILIKE '%' || immutable_unaccent(${escapeLike(word)}) || '%'`;
}

function escapeLike(word) {
    return word.replace(/[\\%_]/g, "\\$&");
}

// pg_search allows one ParadeDB index per table, so the French and English
// fields share the same index and each keeps its own stemmer. Search both by
// default; a language filter can narrow this later.
function bm25Condition(q) {
    return sql`(content_fr @@@ pdb.parse(${q}, lenient => true) OR content_en @@@ pdb.parse(${q}, lenient => true))`;
}

function whereClause(conditions) {
    return conditions.length > 0
        ? sql`WHERE ${conditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}`
        : sql``;
}
