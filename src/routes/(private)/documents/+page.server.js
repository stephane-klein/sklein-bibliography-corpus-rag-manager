import { listDocumentAuthors, searchDocuments } from "#lib/server/document-search.js";

const MAX_QUERY_LENGTH = 200;
const MAX_FILTER_LENGTH = 200;
const MAX_AUTHORS = 20;

function readParam(value, maxLength) {
    return (value ?? "").replaceAll("\u0000", "").trim().slice(0, maxLength);
}

// The picker repeats the author parameter once per selected author. Keep the
// values in the order chosen, without duplicates, and cap the list so a hand
// written URL cannot build an arbitrarily large SQL condition.
function readAuthors(searchParams) {
    return [
        ...new Set(
            searchParams
                .getAll("author")
                .map((value) => readParam(value, MAX_FILTER_LENGTH))
                .filter((value) => value.length > 0),
        ),
    ].slice(0, MAX_AUTHORS);
}

// Splits the title filter into comparable words: lower case, elisions removed
// (l'économie → économie), surrounding punctuation dropped. Unlike the content
// query, every word is kept: the title filter requires all of them to match.
function filterWords(value) {
    return value
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.replace(/^(?:qu|[cdjlmnst])['’]/u, ""))
        .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
        .filter((word) => word.length > 0);
}

export async function load(event) {
    const q = readParam(event.url.searchParams.get("q"), MAX_QUERY_LENGTH);
    const authors = readAuthors(event.url.searchParams);
    const title = readParam(event.url.searchParams.get("title"), MAX_FILTER_LENGTH);
    const semantic = event.url.searchParams.get("semantic") === "1";
    const requestedPage = Number.parseInt(event.url.searchParams.get("page") ?? "1", 10);

    const [data, authorOptions] = await Promise.all([
        searchDocuments({
            q,
            authorNames: authors,
            titleWords: filterWords(title),
            semantic,
            requestedPage,
        }),
        listDocumentAuthors(),
    ]);

    return { ...data, authorOptions, q, authors, title };
}
