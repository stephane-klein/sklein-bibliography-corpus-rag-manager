import { array, check, isoTimestamp, maxLength, minLength, nullable, object, optional, pipe, string } from "valibot";

const MAX_TOKEN_NAME_LENGTH = 100;
const MIN_TOKEN_LENGTH = 32;

const tokenName = pipe(
    string(),
    minLength(1),
    maxLength(MAX_TOKEN_NAME_LENGTH),
    check((value) => value.trim().length > 0, "token name must not be blank"),
);

export const apiTokenUpsertSchema = object({
    name: tokenName,
    token: optional(pipe(string(), minLength(MIN_TOKEN_LENGTH))),
    expires_at: optional(nullable(pipe(string(), isoTimestamp()))),
});

export const apiTokenSyncSchema = object({
    upsert: optional(array(apiTokenUpsertSchema)),
    delete: optional(array(tokenName)),
});
