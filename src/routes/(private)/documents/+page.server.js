import { sql } from "#lib/server/pg.js";

const PAGE_SIZE = 25;
const MAX_QUERY_LENGTH = 200;
const METADATA_MIN_WORD_LENGTH = 3;
const METADATA_SIMILARITY_THRESHOLD = 0.3;
const RRF_K = 60;

// Tantivy operators and quoted phrases only mean something to the BM25 content
// index. When one is present, the metadata search is skipped instead of
// treating "AND" as a word.
const ADVANCED_SYNTAX = /"|\b(?:AND|OR|NOT)\b/;

// Function words that appear in almost every French title. The metadata search
// matches any word (OR), so without this list "le problème de la chance"
// would match every title containing "le", with a similarity of 1.
const FRENCH_STOP_WORDS = new Set([
    "a",
    "au",
    "aux",
    "avec",
    "ce",
    "ces",
    "cet",
    "cette",
    "chez",
    "comme",
    "dans",
    "de",
    "des",
    "dont",
    "du",
    "elle",
    "elles",
    "en",
    "est",
    "et",
    "il",
    "ils",
    "je",
    "la",
    "le",
    "les",
    "leur",
    "leurs",
    "lui",
    "ma",
    "mais",
    "me",
    "mes",
    "moi",
    "mon",
    "ne",
    "nos",
    "notre",
    "nous",
    "on",
    "ou",
    "où",
    "par",
    "pas",
    "plus",
    "pour",
    "qu",
    "que",
    "qui",
    "sa",
    "sans",
    "se",
    "ses",
    "si",
    "son",
    "sont",
    "sous",
    "sur",
    "ta",
    "te",
    "tes",
    "toi",
    "ton",
    "tout",
    "tous",
    "toute",
    "toutes",
    "tu",
    "un",
    "une",
    "vos",
    "votre",
    "vous",
    "y",
    "à",
    "être",
]);

// Splits the query into comparable words: lower case, elisions removed
// (l'économie → économie), stop words and words shorter than three characters
// dropped. Unaccenting happens in SQL, where the extension lives.
function metadataWords(q) {
    return [
        ...new Set(
            q
                .toLowerCase()
                .split(/\s+/)
                .map((word) => word.replace(/^(?:qu|[cdjlmnst])['’]/u, ""))
                .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
                .filter((word) => word.length >= METADATA_MIN_WORD_LENGTH)
                .filter((word) => !FRENCH_STOP_WORDS.has(word)),
        ),
    ];
}

function pageWindow(total, requestedPage) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const page = totalPages > 0 ? Math.min(Math.max(1, requestedPage || 1), totalPages) : 1;
    return { page, totalPages, offset: (page - 1) * PAGE_SIZE };
}

export async function load(event) {
    const q = (event.url.searchParams.get("q") ?? "").replaceAll("\u0000", "").trim().slice(0, MAX_QUERY_LENGTH);
    const requestedPage = Number.parseInt(event.url.searchParams.get("page") ?? "1", 10);

    if (q.length === 0) {
        const [{ total }] = await sql`
            SELECT count(*)::int AS total
              FROM hierarchical_content_nodes
        `;
        const { page, totalPages, offset } = pageWindow(total, requestedPage);

        const documents = await sql`
            SELECT nanoid, title, authors, original_published_date, source_url
              FROM hierarchical_content_nodes
             ORDER BY original_published_date DESC NULLS LAST, id DESC
             LIMIT ${PAGE_SIZE} OFFSET ${offset}
        `;

        return { documents, page, total, totalPages, q };
    }

    const words = ADVANCED_SYNTAX.test(q) ? [] : metadataWords(q);

    // Two rank sources, fused with reciprocal rank fusion: BM25 scores and
    // trigram similarities are not comparable, their ranks are. An empty word
    // list leaves metadata_matches empty, so the fused list is content only.
    const matches = sql`
        content_matches AS (
            SELECT nanoid,
                   row_number() OVER (ORDER BY pdb.score(id) DESC, id ASC) AS rank
              FROM hierarchical_content_nodes
             WHERE content @@@ pdb.parse(${q}, lenient => true)
        ),
        metadata_matches AS (
            SELECT nanoid,
                   max(similarity) AS similarity,
                   row_number() OVER (ORDER BY max(similarity) DESC, nanoid ASC) AS rank
              FROM (
                    SELECT nanoid,
                           GREATEST(
                               word_similarity(immutable_unaccent(term), immutable_unaccent(title)),
                               word_similarity(
                                   immutable_unaccent(term),
                                   immutable_unaccent(immutable_authors_text(authors))
                               )
                           ) AS similarity
                      FROM hierarchical_content_nodes
                      CROSS JOIN unnest(${words}::text[]) AS tokens(term)
                     WHERE immutable_unaccent(term) <% immutable_unaccent(title)
                        OR immutable_unaccent(term) <% immutable_unaccent(immutable_authors_text(authors))
              ) term_matches
             GROUP BY nanoid
        ),
        fused AS (
            SELECT coalesce(content_matches.nanoid, metadata_matches.nanoid) AS nanoid,
                   coalesce(1.0 / (${RRF_K} + content_matches.rank), 0)
                 + coalesce(1.0 / (${RRF_K} + metadata_matches.rank), 0) AS score
              FROM content_matches
              FULL OUTER JOIN metadata_matches
                ON metadata_matches.nanoid = content_matches.nanoid
        )
    `;

    return sql.begin(async (tx) => {
        // The `<%` operator reads its threshold from this GUC, whose default is
        // 0.6. SET LOCAL scopes the value to this transaction.
        await tx.unsafe(`SET LOCAL pg_trgm.word_similarity_threshold = ${METADATA_SIMILARITY_THRESHOLD}`);

        const [{ total }] = await tx`
            WITH ${matches}
            SELECT count(*)::int AS total
              FROM fused
        `;
        const { page, totalPages, offset } = pageWindow(total, requestedPage);

        const documents = await tx`
            WITH ${matches}
            SELECT d.nanoid, d.title, d.authors, d.original_published_date, d.source_url
              FROM fused
              JOIN hierarchical_content_nodes d ON d.nanoid = fused.nanoid
             ORDER BY fused.score DESC, d.original_published_date DESC NULLS LAST, d.nanoid ASC
             LIMIT ${PAGE_SIZE} OFFSET ${offset}
        `;

        return { documents, page, total, totalPages, q };
    });
}
