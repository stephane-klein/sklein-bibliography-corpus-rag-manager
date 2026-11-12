const MAX_STRING_CHARS = 200;
const MAX_ARRAY_ITEMS = 20;
const MAX_JSON_CHARS = 4096;

const TOOL_ARGUMENT_KEYS = {
    readOnlySqlQuery: ["maxCharacters"],
    semanticSearch: ["authors", "title", "limit", "page", "maxCharacters"],
};

function sanitizeValue(value, depth = 0) {
    if (value === null || value === undefined) return null;

    if (typeof value === "string") {
        return value.length > MAX_STRING_CHARS ? `${value.slice(0, MAX_STRING_CHARS)}…` : value;
    }

    if (typeof value === "number" || typeof value === "boolean") return value;

    if (Array.isArray(value)) {
        return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1));
    }

    if (typeof value === "object") {
        if (depth >= 3) return "[truncated]";

        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeValue(item, depth + 1)]));
    }

    return String(value);
}

export function sanitizeJsonObject(value = {}) {
    const sanitized = sanitizeValue(value ?? {});
    const json = JSON.stringify(sanitized);

    if (json.length <= MAX_JSON_CHARS) return sanitized;

    return { truncated: true, preview: `${json.slice(0, MAX_JSON_CHARS)}…` };
}

export function toolArgumentsFor(toolName, args = {}) {
    const keys = TOOL_ARGUMENT_KEYS[toolName] ?? [];

    return sanitizeJsonObject(Object.fromEntries(keys.filter((key) => key in args).map((key) => [key, args[key]])));
}

export function resultMetaFor(meta = {}) {
    return sanitizeJsonObject(meta);
}
