#!/usr/bin/env node
// Utility script — loads and executes all SQL seed files from sqls/seeds/
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./lib/server/logger.js";
import { POSTGRES_SCHEMA, sql, waitForDb } from "./lib/server/pg.js";

await waitForDb();

logger.info({ schema: POSTGRES_SCHEMA }, "Using PostgreSQL schema");

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedsDir = join(__dirname, "..", "sqls/seeds");

const files = readdirSync(seedsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

for (const file of files) {
    logger.info(
        {
            file,
        },
        "Loading seed",
    );
    const content = readFileSync(join(seedsDir, file), "utf8");
    await sql.unsafe(content);
}

await sql.end();
