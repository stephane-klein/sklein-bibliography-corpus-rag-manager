import { array, check, maxLength, minLength, object, optional, picklist, pipe, string } from "valibot";

const MAX_TEXTS = 128;
const MAX_TEXT_CHARS = 32_000;
const MAX_TOTAL_CHARS = 200_000;

export const embeddingRequestSchema = object({
    input_type: optional(picklist(["document", "query"])),
    texts: pipe(
        array(pipe(string(), minLength(1), maxLength(MAX_TEXT_CHARS))),
        minLength(1),
        maxLength(MAX_TEXTS),
        check(
            (texts) => texts.reduce((total, text) => total + text.length, 0) <= MAX_TOTAL_CHARS,
            `must not exceed ${MAX_TOTAL_CHARS} characters in total`,
        ),
    ),
});
