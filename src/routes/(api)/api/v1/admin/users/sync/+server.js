import { safeParse } from "valibot";
import { generateApiTokenSecret, generateId, hashPassword, hashToken } from "#lib/server/auth.js";
import { planApiTokenChange } from "#lib/server/api-token-sync.js";
import { sql } from "#lib/server/pg.js";
import { userSyncUpsertSchema } from "#lib/schemas/user.js";
import { problem } from "#lib/server/problem.js";
import { requireAdminToken } from "../../_helpers.js";

const MAX_BATCH_SIZE = 1000;

class SyncError extends Error {
    constructor(status, detail) {
        super(detail);
        this.status = status;
        this.detail = detail;
    }
}

function conflictDetail(err) {
    if (err.constraint_name === "users_email_key") return "A user with this email already exists";
    if (err.constraint_name === "idx_users_oidc") return "A user with this OIDC pair already exists";
    return "A token with this name or value already exists";
}

function validateTokenSync(tokens, email) {
    const tokenUpserts = tokens?.upsert ?? [];
    const tokenDeletes = tokens?.delete ?? [];
    const seenUpsert = new Set();
    const seenDelete = new Set();

    const upsert = tokenUpserts.map((token) => {
        const name = token.name.trim();

        if (seenUpsert.has(name)) {
            throw new SyncError(422, `duplicate token name in upsert for ${email}: ${name}`);
        }
        seenUpsert.add(name);

        const expiresAt =
            token.expires_at === undefined ? undefined : token.expires_at === null ? null : new Date(token.expires_at);

        if (expiresAt && expiresAt.getTime() <= Date.now()) {
            throw new SyncError(422, `expires_at must be in the future for ${email}: ${name}`);
        }

        return {
            name,
            token: token.token ?? null,
            expiresAt,
        };
    });

    const deletes = tokenDeletes.map((rawName) => {
        const name = rawName.trim();

        if (seenDelete.has(name)) {
            throw new SyncError(422, `duplicate token name in delete for ${email}: ${name}`);
        }
        seenDelete.add(name);

        return name;
    });

    for (const name of deletes) {
        if (seenUpsert.has(name)) {
            throw new SyncError(422, `token name present in both upsert and delete for ${email}: ${name}`);
        }
    }

    return { upsert, delete: deletes };
}

function validateUpsertItem(item) {
    const fields = safeParse(userSyncUpsertSchema, item);
    if (!fields.success) {
        throw new SyncError(400, fields.issues[0].message);
    }
    const { email: rawEmail, display_name, password, oidc_issuer, oidc_subject, tokens } = fields.output;
    const email = rawEmail?.trim();
    const displayName = display_name?.trim();
    const oidcIssuer = oidc_issuer?.replace(/\/$/, "").trim();
    const oidcSubject = oidc_subject?.trim();

    if (!email) throw new SyncError(400, "each upsert item must have a non-empty email");
    if (!displayName) throw new SyncError(400, "each upsert item must have a non-empty display_name");

    const hasOidc = oidcIssuer !== undefined || oidcSubject !== undefined;
    if ((oidcIssuer === undefined) !== (oidcSubject === undefined)) {
        throw new SyncError(422, "Both oidc_issuer and oidc_subject must be provided together");
    }

    return {
        email,
        displayName,
        password,
        oidcIssuer: oidcIssuer || null,
        oidcSubject: oidcSubject || null,
        hasOidc,
        tokens: validateTokenSync(tokens, email),
    };
}

export async function PUT(event) {
    const authError = requireAdminToken(event);
    if (authError) return authError;

    try {
        const body = await event.request.json();
        const upsert = Array.isArray(body.upsert) ? body.upsert : [];
        const deleteTargets = Array.isArray(body.delete) ? body.delete : [];

        if (upsert.length + deleteTargets.length === 0) {
            return problem(400, "upsert or delete must contain at least one item", event.request.url);
        }
        if (upsert.length + deleteTargets.length > MAX_BATCH_SIZE) {
            return problem(422, `batch size must not exceed ${MAX_BATCH_SIZE} items`, event.request.url);
        }

        const upsertItems = [];
        const deleteEmails = [];
        const seenUpsert = new Set();
        const seenDelete = new Set();

        for (const item of upsert) {
            if (typeof item !== "object" || item === null) {
                return problem(422, "each upsert item must be an object", event.request.url);
            }
            const validated = validateUpsertItem(item);
            if (seenUpsert.has(validated.email)) {
                return problem(422, `duplicate email in upsert: ${validated.email}`, event.request.url);
            }
            seenUpsert.add(validated.email);
            upsertItems.push(validated);
        }

        for (const item of deleteTargets) {
            const email = item?.email?.trim();
            if (!email) {
                return problem(422, "each delete item must be an object with a non-empty email", event.request.url);
            }
            if (seenDelete.has(email)) {
                return problem(422, `duplicate email in delete: ${email}`, event.request.url);
            }
            seenDelete.add(email);
            deleteEmails.push(email);
        }

        for (const email of deleteEmails) {
            if (seenUpsert.has(email)) {
                return problem(422, `email present in both upsert and delete: ${email}`, event.request.url);
            }
        }

        // Hash passwords and token values before opening the transaction, so the
        // transaction only performs database work.
        const preparedUpsertItems = await Promise.all(
            upsertItems.map(async (item) => ({
                ...item,
                passwordHash: item.password ? await hashPassword(item.password) : null,
                tokens: {
                    upsert: await Promise.all(
                        item.tokens.upsert.map(async (token) => {
                            const generatedRaw = token.token ? null : generateApiTokenSecret();

                            return {
                                ...token,
                                providedHash: token.token ? await hashToken(token.token) : null,
                                generatedRaw,
                                generatedHash: generatedRaw ? await hashToken(generatedRaw) : null,
                            };
                        }),
                    ),
                    delete: item.tokens.delete,
                },
            })),
        );

        const now = new Date();

        const {
            created,
            updated,
            deleted,
            tokens: tokenSummary,
            rawTokens,
            users,
        } = await sql.begin(async (tx) => {
            const emails = [...seenUpsert, ...deleteEmails];
            const existingRows = await tx`
                SELECT id, email, password_hash FROM users WHERE email IN ${tx(emails)}
            `;
            const existingByEmail = new Map(existingRows.map((row) => [row.email, row]));

            for (const item of preparedUpsertItems) {
                if (!item.hasOidc) continue;

                const conflict = await tx`
                    SELECT email FROM users
                    WHERE oidc_issuer = ${item.oidcIssuer} AND oidc_subject = ${item.oidcSubject}
                    AND email != ${item.email}
                `;
                if (conflict.length > 0) {
                    throw new SyncError(409, `A user with this OIDC pair already exists: ${item.email}`);
                }
            }

            const userIdByEmail = new Map(
                preparedUpsertItems.map((item) => [item.email, existingByEmail.get(item.email)?.id ?? generateId()]),
            );
            const userIds = [...new Set(userIdByEmail.values())];
            const existingTokenRows =
                userIds.length > 0
                    ? await tx`
                          SELECT id, user_id, name, token_hash, expires_at
                          FROM api_tokens
                          WHERE user_id IN ${tx(userIds)}
                      `
                    : [];
            const existingTokenByUserAndName = new Map(
                existingTokenRows.map((row) => [`${row.user_id}\u0000${row.name}`, row]),
            );

            let created = 0;
            let updated = 0;
            let deleted = 0;
            const tokenSummary = { created: 0, updated: 0, deleted: 0, unchanged: 0 };
            const rawTokens = [];

            for (const item of preparedUpsertItems) {
                const existing = existingByEmail.get(item.email);
                const userId = userIdByEmail.get(item.email);

                if (!existing) {
                    await tx`
                        INSERT INTO users (id, email, display_name, password_hash, oidc_issuer, oidc_subject)
                        VALUES (${userId}, ${item.email}, ${item.displayName}, ${item.passwordHash},
                                ${item.oidcIssuer}, ${item.oidcSubject})
                    `;
                    created += 1;
                } else {
                    await tx`
                        UPDATE users
                        SET display_name  = ${item.displayName},
                            password_hash = ${item.password ? item.passwordHash : existing.password_hash},
                            oidc_issuer   = ${item.oidcIssuer},
                            oidc_subject  = ${item.oidcSubject},
                            updated_at    = ${now}
                        WHERE email = ${item.email}
                    `;
                    updated += 1;
                }

                for (const token of item.tokens.upsert) {
                    const existingToken = existingTokenByUserAndName.get(`${userId}\u0000${token.name}`) ?? null;
                    const plan = planApiTokenChange({
                        existing: existingToken,
                        providedHash: token.providedHash,
                        generatedHash: token.generatedHash,
                        expiresAt: token.expiresAt,
                    });

                    if (plan.action === "created") {
                        await tx`
                            INSERT INTO api_tokens (id, user_id, name, token_hash, expires_at)
                            VALUES (${generateId()}, ${userId}, ${token.name}, ${plan.tokenHash},
                                    ${plan.expiresAt})
                        `;
                    } else if (plan.action === "updated") {
                        await tx`
                            UPDATE api_tokens
                            SET token_hash = ${plan.tokenHash}, expires_at = ${plan.expiresAt}
                            WHERE id = ${existingToken.id}
                        `;
                    }

                    tokenSummary[plan.action] += 1;

                    if (plan.generated && plan.action === "created") {
                        rawTokens.push({
                            email: item.email,
                            name: token.name,
                            token: token.generatedRaw,
                        });
                    }
                }

                for (const name of item.tokens.delete) {
                    const existingToken = existingTokenByUserAndName.get(`${userId}\u0000${name}`);

                    if (existingToken) {
                        await tx`DELETE FROM api_tokens WHERE id = ${existingToken.id}`;
                        tokenSummary.deleted += 1;
                    }
                }
            }

            for (const email of deleteEmails) {
                if (existingByEmail.has(email)) {
                    await tx`DELETE FROM users WHERE email = ${email}`;
                    deleted += 1;
                }
            }

            const users = await tx`
                SELECT id, email, display_name, oidc_issuer, oidc_subject, is_active, created_at, updated_at
                FROM users ORDER BY created_at, id
            `;

            return { created, updated, deleted, tokens: tokenSummary, rawTokens, users };
        });

        return Response.json({
            data: {
                created,
                updated,
                deleted,
                tokens: tokenSummary,
                raw_tokens: rawTokens,
                users,
            },
            _links: {
                self: { href: "/api/v1/admin/users/sync" },
                collection: { href: "/api/v1/admin/users" },
            },
        });
    } catch (err) {
        if (err instanceof SyncError) {
            return problem(err.status, err.detail, event.request.url);
        }
        if (err.code === "23505") {
            return problem(409, conflictDetail(err), event.request.url);
        }
        throw err;
    }
}
