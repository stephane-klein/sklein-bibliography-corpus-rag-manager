#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createApiToken } from "./lib/server/auth.js";
import { logger } from "./lib/server/logger.js";
import { sql, waitForDb } from "./lib/server/pg.js";

const argv = yargs(hideBin(process.argv))
    .option("email", {
        type: "string",
        demandOption: true,
        description: "User email address",
    })
    .option("name", {
        type: "string",
        demandOption: true,
        description: "Token name (e.g. 'CI/CD deploy')",
    })
    .option("expires-in-days", {
        type: "number",
        description: "Number of days before the token expires (omit for no expiration)",
    })
    .parse();

await waitForDb();

const [user] = await sql`SELECT id, email FROM users WHERE email = ${argv.email}`;

if (!user) {
    logger.error({ email: argv.email }, "User not found");
    process.exit(1);
}

let token;
try {
    token = await createApiToken(user.id, argv.name, argv["expires-in-days"] || null);
} catch (err) {
    if (err.code === "23505") {
        logger.error({ email: argv.email, name: argv.name }, "A token with this name already exists for this user");
        await sql.end();
        process.exit(1);
    }
    throw err;
}

logger.info({ name: argv.name }, "API token created");
console.log("\nRaw token (shown once — store it safely):");
console.log(token.raw);

await sql.end();
