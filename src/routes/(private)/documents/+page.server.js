import { sql } from "#lib/server/pg.js";

const PAGE_SIZE = 15;
const MAX_QUERY_LENGTH = 200;
const MAX_FILTER_LENGTH = 200;

function readParam(value, maxLength) {
    return (value ?? "").replaceAll("\u0000", "").trim().slice(0, maxLength);
}

// Splits a filter field into comparable words: lower case, elisions removed
// (l'économie → économie), surrounding punctuation dropped. Unlike the content
// query, every word is kept: the filter requires all of them to match.
function filterWords(value) {
    return value
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.replace(/^(?:qu|[cdjlmnst])['’]/u, ""))
        .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
        .filter((word) => word.length > 0);
}

// `%` and `_` are ILIKE wildcards. Escape them so a filter matches literal text.
function escapeLike(word) {
    return word.replace(/[\\%_]/g, "\\$&");
}

function ilikeCondition(column, word) {
    return sql`${column} ILIKE '%' || immutable_unaccent(${escapeLike(word)}) || '%'`;
}

function allWords(column, words) {
    return words.map((word) => ilikeCondition(column, word)).reduce((acc, condition) => sql`${acc} AND ${condition}`);
}

function whereClause(conditions) {
    return conditions.length > 0
        ? sql`WHERE ${conditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}`
        : sql``;
}

function pageWindow(total, requestedPage) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const page = totalPages > 0 ? Math.min(Math.max(1, requestedPage || 1), totalPages) : 1;
    return { page, totalPages, offset: (page - 1) * PAGE_SIZE };
}

export async function load(event) {
    const q = readParam(event.url.searchParams.get("q"), MAX_QUERY_LENGTH);
    const author = readParam(event.url.searchParams.get("author"), MAX_FILTER_LENGTH);
    const title = readParam(event.url.searchParams.get("title"), MAX_FILTER_LENGTH);
    const requestedPage = Number.parseInt(event.url.searchParams.get("page") ?? "1", 10);

    const authorWords = filterWords(author);
    const titleWords = filterWords(title);

    // Title and author are filters, not rank sources: the content query is the
    // only score. Each field requires all its words; the fields combine with AND.
    const filterConditions = [
        authorWords.length > 0 ? allWords(sql`immutable_unaccent(immutable_authors_text(authors))`, authorWords) : null,
        titleWords.length > 0 ? allWords(sql`immutable_unaccent(title)`, titleWords) : null,
    ].filter((condition) => condition !== null);

    const matchConditions = q
        ? [sql`content @@@ pdb.parse(${q}, lenient => true)`, ...filterConditions]
        : filterConditions;

    const [{ total: corpusTotal }] = await sql`
        SELECT count(*)::int AS total
          FROM hierarchical_content_nodes
    `;

    const selectionRows =
        filterConditions.length > 0
            ? await sql`
                  SELECT count(*)::int AS total
                    FROM hierarchical_content_nodes
                    ${whereClause(filterConditions)}
              `
            : [{ total: corpusTotal }];

    const selectionTotal = selectionRows[0].total;

    const [{ total }] = q
        ? await sql`
              SELECT count(*)::int AS total
                FROM hierarchical_content_nodes
                ${whereClause(matchConditions)}
          `
        : [{ total: selectionTotal }];

    const { page, totalPages, offset } = pageWindow(total, requestedPage);

    // pdb.snippets() is the expensive part; the LIMIT keeps the number of
    // highlighted rows bounded. The snippet tags are restored by the component.
    const documents = q
        ? await sql`
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
        : await sql`
              SELECT nanoid, title, authors, original_published_date, source_url
                FROM hierarchical_content_nodes
                ${whereClause(matchConditions)}
               ORDER BY original_published_date DESC NULLS LAST, id DESC
               LIMIT ${PAGE_SIZE} OFFSET ${offset}
          `;

    return {
        documents,
        page,
        total,
        totalPages,
        corpusTotal,
        selectionTotal,
        q,
        author,
        title,
        filtered: filterConditions.length > 0,
        hasQuery: q.length > 0,
    };
}
