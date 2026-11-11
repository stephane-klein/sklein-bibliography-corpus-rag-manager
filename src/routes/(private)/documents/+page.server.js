import { searchDocuments } from "#lib/server/document-search.js";

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

export async function load(event) {
    const q = readParam(event.url.searchParams.get("q"), MAX_QUERY_LENGTH);
    const author = readParam(event.url.searchParams.get("author"), MAX_FILTER_LENGTH);
    const title = readParam(event.url.searchParams.get("title"), MAX_FILTER_LENGTH);
    const semantic = event.url.searchParams.get("semantic") === "1";
    const requestedPage = Number.parseInt(event.url.searchParams.get("page") ?? "1", 10);

    const data = await searchDocuments({
        q,
        authorWords: filterWords(author),
        titleWords: filterWords(title),
        semantic,
        requestedPage,
    });

    return { ...data, q, author, title };
}
