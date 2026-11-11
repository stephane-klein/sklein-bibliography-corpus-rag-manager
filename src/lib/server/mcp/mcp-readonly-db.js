import postgres from "postgres";

import { onShutdown } from "#lib/server/lifecycle.js";
import { logger } from "#lib/server/logger.js";
import { POSTGRES_SCHEMA } from "#lib/server/pg.js";
import { getMcpReaderPassword, getMcpReaderRole } from "./mcp-reader-role.js";

const POSTGRES_URL = process.env.SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_URL;

const READABLE_TABLES = ["hierarchical_content_nodes", "content_chunks"];

function buildReaderUrl() {
    if (!POSTGRES_URL) return null;

    const password = getMcpReaderPassword();

    if (!password) return null;

    const url = new URL(POSTGRES_URL);
    url.username = getMcpReaderRole();
    url.password = password;

    return url.toString();
}

const readerUrl = buildReaderUrl();

export const sqlReadonly = readerUrl
    ? postgres(readerUrl, {
          max: 5,
          idle_timeout: 5,
          max_lifetime: 60,
          connection: {
              search_path: POSTGRES_SCHEMA,
              default_transaction_read_only: "on",
              statement_timeout: "10s",
              idle_in_transaction_session_timeout: "10s",
          },
          onnotice: (notice) => logger.debug({ ...notice }, "MCP read-only PostgreSQL notice"),
      })
    : null;

if (!sqlReadonly) {
    logger.warn(
        "MCP read-only DB client not created — SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_URL " +
            "or SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_READONLY_POSTGRES_PASSWORD is not set",
    );
}

if (sqlReadonly) {
    onShutdown(() => sqlReadonly.end({ timeout: 5 }));
}

let cachedSchema = null;

export async function getReadOnlyTablesSchema() {
    if (cachedSchema) return cachedSchema;
    if (!sqlReadonly) throw new Error("MCP read-only access disabled");

    const describe = async (table) => {
        const rows = await sqlReadonly`
            SELECT a.attname AS column_name,
                   format_type(a.atttypid, a.atttypmod) AS data_type
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = ${POSTGRES_SCHEMA}
              AND c.relname = ${table}
              AND a.attnum > 0 AND NOT a.attisdropped
            ORDER BY a.attnum`;
        return `  ${rows.map(({ column_name, data_type }) => `${column_name}  ${data_type}`).join(",\n  ")}`;
    };

    cachedSchema = (
        await Promise.all(READABLE_TABLES.map(async (table) => `${table}(\n${await describe(table)}\n)`))
    ).join(", ");

    return cachedSchema;
}
