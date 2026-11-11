import { logger } from "#lib/server/logger.js";
import { POSTGRES_SCHEMA, sql } from "#lib/server/pg.js";

export const MCP_READER_ROLE_ENV = "SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_READONLY_POSTGRES_ROLE";
export const MCP_READER_PASSWORD_ENV = "SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_MCP_READONLY_POSTGRES_PASSWORD";
export const MCP_READER_DEFAULT_ROLE = "sklein_bibliography_mcp_reader";

const ROLE_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const SCHEMA_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function escapeSqlString(value) {
    return value.replace(/'/g, "''");
}

export function getMcpReaderRole() {
    return process.env[MCP_READER_ROLE_ENV] || MCP_READER_DEFAULT_ROLE;
}

export function getMcpReaderPassword() {
    return process.env[MCP_READER_PASSWORD_ENV] || null;
}

// Creates the reader role when the application role is allowed to, then grants
// the minimum privileges the MCP server needs. When the role is provisioned
// externally (for example by CloudNativePG managed.roles), the application role
// only grants privileges and leaves the password alone.
export async function ensureMcpReaderRole() {
    const role = getMcpReaderRole();
    const password = getMcpReaderPassword();

    if (!password) {
        logger.warn(
            { role, env: MCP_READER_PASSWORD_ENV },
            "MCP reader role not created — password env var not set, MCP read-only access disabled",
        );
        return;
    }

    if (!ROLE_NAME_REGEX.test(role) || !SCHEMA_NAME_REGEX.test(POSTGRES_SCHEMA)) {
        logger.error({ role, schema: POSTGRES_SCHEMA }, "Invalid role or schema name, MCP reader role not created");
        return;
    }

    try {
        await ensureRoleExists(role, password);
        await grantReaderPrivileges(role);
        await setReaderSessionDefaults(role);

        logger.info({ role, schema: POSTGRES_SCHEMA }, "MCP reader role ensured");
    } catch (err) {
        logger.error({ err, role }, "Failed to create or grant the MCP reader role");
    }
}

async function ensureRoleExists(role, password) {
    const [current] = await sql`
        SELECT rolsuper, rolcreaterole FROM pg_roles WHERE rolname = current_user
    `;
    const canManageRoles = Boolean(current?.rolsuper || current?.rolcreaterole);

    const [existing] = await sql`SELECT 1 AS found FROM pg_roles WHERE rolname = ${role}`;

    if (!existing && !canManageRoles) {
        throw new Error(
            `Cannot create MCP reader role "${role}" — the current PostgreSQL role cannot CREATE ROLE. ` +
                "Provision the role yourself (for example via CloudNativePG spec.managed.roles) with a password " +
                `matching ${MCP_READER_PASSWORD_ENV}, then restart.`,
        );
    }

    if (canManageRoles) {
        await sql.unsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${escapeSqlString(role)}') THEN
                    CREATE ROLE "${role}" LOGIN;
                END IF;
            END
            $$;
            ALTER ROLE "${role}" WITH LOGIN PASSWORD '${escapeSqlString(password)}';
        `);
    }
}

async function grantReaderPrivileges(role) {
    await sql.unsafe(`
        GRANT USAGE ON SCHEMA "${POSTGRES_SCHEMA}" TO "${role}";
        GRANT SELECT ON "${POSTGRES_SCHEMA}".hierarchical_content_nodes TO "${role}";
        GRANT SELECT ON "${POSTGRES_SCHEMA}".content_chunks TO "${role}";
    `);

    // The corpus queries call these IMMUTABLE wrappers for the trigram indexes.
    for (const signature of ["immutable_unaccent(text)", "immutable_authors_text(text[])"]) {
        try {
            await sql.unsafe(`GRANT EXECUTE ON FUNCTION "${POSTGRES_SCHEMA}".${signature} TO "${role}"`);
        } catch (err) {
            logger.warn({ err, role, signature }, "Could not grant MCP reader function privilege");
        }
    }

    // ParadeDB puts parse()/score() and the BM25 operators in the pdb schema.
    // The functions are read-only; granting the whole schema avoids depending
    // on the exact signatures shipped by each ParadeDB version.
    try {
        await sql.unsafe(`
            GRANT USAGE ON SCHEMA pdb TO "${role}";
            GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pdb TO "${role}";
        `);
    } catch (err) {
        logger.warn({ err, role }, "Could not grant ParadeDB function privileges to the MCP reader role");
    }
}

async function setReaderSessionDefaults(role) {
    try {
        await sql.unsafe(`
            ALTER ROLE "${role}" SET statement_timeout = '10s';
            ALTER ROLE "${role}" SET idle_in_transaction_session_timeout = '10s';
            ALTER ROLE "${role}" SET default_transaction_read_only = on;
        `);
    } catch (err) {
        // The application role may not own an externally provisioned role. The
        // reader client applies the same settings on every connection.
        logger.debug({ err, role }, "Cannot set session defaults on the MCP reader role; using connection defaults");
    }
}
