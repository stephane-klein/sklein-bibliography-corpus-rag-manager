#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { hashPassword, generateId } from "./lib/server/auth.js";
import { logger } from "./lib/server/logger.js";
import { sql, waitForDb } from "./lib/server/pg.js";

const argv = yargs(hideBin(process.argv))
    .option("email", {
        type: "string",
        demandOption: true,
        description: "User email address",
    })
    .option("password", {
        type: "string",
        description: "User password (optional; users without one sign in via magic link or reset their password)",
        conflicts: "password-stdin",
    })
    .option("password-stdin", {
        type: "boolean",
        description: "Read password from stdin (mutually exclusive with --password)",
        conflicts: "password",
    })
    .option("display-name", {
        type: "string",
        description: "Display name (defaults to email)",
    })
    .option("oidc-issuer", {
        type: "string",
        description: "OIDC issuer URL",
    })
    .option("oidc-subject", {
        type: "string",
        description: "OIDC subject identifier",
    })
    .check((argv) => {
        if (argv["oidc-issuer"] && !argv["oidc-subject"]) {
            throw new Error("--oidc-subject is required when --oidc-issuer is provided");
        }

        if (argv["oidc-subject"] && !argv["oidc-issuer"]) {
            throw new Error("--oidc-issuer is required when --oidc-subject is provided");
        }

        return true;
    })
    .parse();

await waitForDb();

let passwordHash = null;

if (argv.password) {
    logger.info("Hashing password…");
    passwordHash = await hashPassword(argv.password);
} else if (argv["password-stdin"]) {
    logger.info("Reading password from stdin…");
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const password = Buffer.concat(chunks).toString("utf8").trim();
    if (!password) {
        logger.error("No password provided via stdin");
        process.exit(1);
    }
    passwordHash = await hashPassword(password);
}

const id = generateId();
const displayName = argv["display-name"] || argv.email;

logger.info({ email: argv.email, displayName }, "Creating user…");

await sql`INSERT INTO users (id, email, display_name, password_hash, oidc_issuer, oidc_subject)
          VALUES (${id}, ${argv.email}, ${displayName}, ${passwordHash}, ${(argv["oidc-issuer"] || "").replace(/\/$/, "") || null}, ${argv["oidc-subject"] || null})`;

logger.info({ id, email: argv.email }, "User created");

await sql.end();
