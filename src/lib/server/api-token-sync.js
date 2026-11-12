function timeOf(value) {
    return value === null || value === undefined ? null : new Date(value).getTime();
}

// Decides what to do with one token declaration. The caller has already
// computed the hashes and normalised expiresAt to a Date, null or undefined:
// undefined means "keep the current expiration" (or "no expiration" on create).
export function planApiTokenChange({ existing, providedHash, generatedHash, expiresAt }) {
    if (!existing) {
        return {
            action: "created",
            tokenHash: providedHash ?? generatedHash,
            expiresAt: expiresAt === undefined ? null : expiresAt,
            generated: providedHash === null,
        };
    }

    const tokenHash = providedHash ?? existing.token_hash;
    const nextExpiresAt = expiresAt === undefined ? existing.expires_at : expiresAt;
    const changed = tokenHash !== existing.token_hash || timeOf(nextExpiresAt) !== timeOf(existing.expires_at);

    return {
        action: changed ? "updated" : "unchanged",
        tokenHash,
        expiresAt: nextExpiresAt,
        generated: false,
    };
}
