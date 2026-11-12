import assert from "node:assert/strict";
import test from "node:test";

import { planApiTokenChange } from "../src/lib/server/api-token-sync.js";

const existing = {
    id: "token-1",
    token_hash: "a".repeat(64),
    expires_at: new Date("2027-01-01T00:00:00Z"),
};

test("creates a token with a supplied value", () => {
    const plan = planApiTokenChange({
        existing: null,
        providedHash: "b".repeat(64),
        generatedHash: "c".repeat(64),
        expiresAt: new Date("2027-06-01T00:00:00Z"),
    });

    assert.deepEqual(plan, {
        action: "created",
        tokenHash: "b".repeat(64),
        expiresAt: new Date("2027-06-01T00:00:00Z"),
        generated: false,
    });
});

test("creates a generated token when no value is supplied", () => {
    const plan = planApiTokenChange({
        existing: null,
        providedHash: null,
        generatedHash: "c".repeat(64),
        expiresAt: undefined,
    });

    assert.equal(plan.action, "created");
    assert.equal(plan.tokenHash, "c".repeat(64));
    assert.equal(plan.expiresAt, null);
    assert.equal(plan.generated, true);
});

test("keeps an existing token when no value is supplied", () => {
    const plan = planApiTokenChange({
        existing,
        providedHash: null,
        generatedHash: "c".repeat(64),
        expiresAt: undefined,
    });

    assert.equal(plan.action, "unchanged");
    assert.equal(plan.tokenHash, existing.token_hash);
    assert.equal(plan.generated, false);
});

test("keeps an existing token when the supplied value is unchanged", () => {
    const plan = planApiTokenChange({
        existing,
        providedHash: existing.token_hash,
        generatedHash: "c".repeat(64),
        expiresAt: undefined,
    });

    assert.equal(plan.action, "unchanged");
    assert.equal(plan.tokenHash, existing.token_hash);
});

test("updates the hash when the supplied value differs", () => {
    const plan = planApiTokenChange({
        existing,
        providedHash: "b".repeat(64),
        generatedHash: "c".repeat(64),
        expiresAt: undefined,
    });

    assert.equal(plan.action, "updated");
    assert.equal(plan.tokenHash, "b".repeat(64));
    assert.equal(plan.generated, false);
});

test("updates only the expiration", () => {
    const nextExpiresAt = new Date("2028-01-01T00:00:00Z");
    const plan = planApiTokenChange({
        existing,
        providedHash: null,
        generatedHash: "c".repeat(64),
        expiresAt: nextExpiresAt,
    });

    assert.equal(plan.action, "updated");
    assert.equal(plan.tokenHash, existing.token_hash);
    assert.equal(plan.expiresAt, nextExpiresAt);
});
