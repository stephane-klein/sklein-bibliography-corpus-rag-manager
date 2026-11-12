import { toJsonSchema } from "@valibot/to-json-schema";
import { apiTokenSyncSchema } from "#lib/schemas/api-token.js";
import { contentChunkSyncSchema } from "#lib/schemas/content-chunk.js";
import { contentNodeSyncSchema } from "#lib/schemas/content-node.js";
import { embeddingRequestSchema } from "#lib/schemas/embedding.js";
import { userFieldsSchema, userPatchSchema, userSyncUpsertSchema } from "#lib/schemas/user.js";

// Request-body schemas are derived from the valibot schemas that actually
// validate the handlers, so the OpenAPI contract can never drift from the code.
// `$schema` is JSON-Schema-only metadata and must not appear in an OpenAPI 3.0
// component. `annotate` overlays examples/descriptions (which toJsonSchema does
// not emit) and the accurate `required` arrays on top of the derived structure.
const stripSchemaMeta = ({ $schema: _schema, ...rest }) => rest;

const annotate = (base, { required, props }) => ({
    ...base,
    required,
    properties: Object.fromEntries(
        Object.entries(base.properties).map(([name, schema]) => [
            name,
            props[name] ? { ...schema, ...props[name] } : schema,
        ]),
    ),
});

const upsertAnnotations = {
    email: { description: "User email address", example: "user@example.com" },
    display_name: { description: "Display name", example: "John Doe" },
    password: {
        description: "Optional. Users without a password sign in via magic link or reset their password",
        format: "password",
        example: "s3cur3!",
    },
    oidc_issuer: { description: "OIDC issuer URL", example: "https://auth.example.com" },
    oidc_subject: { description: "OIDC subject identifier", example: "johndoe" },
};

// The upsert paths (PUT and sync) unconditionally require email + display_name;
// the POST body also uses this schema but omits `required` because the OIDC
// branch makes those fields conditionally optional.
const userUpsertJson = annotate(stripSchemaMeta(toJsonSchema(userFieldsSchema)), {
    required: ["email", "display_name"],
    props: upsertAnnotations,
});
// POST shares the same fields as the upsert but must not mark fields required,
// because the OIDC branch accepts a user with only an OIDC pair.
const userCreateJson = { ...userUpsertJson, required: [] };
const userPatchJson = annotate(stripSchemaMeta(toJsonSchema(userPatchSchema)), {
    required: [],
    props: { ...upsertAnnotations, is_active: { description: "Whether the account is active" } },
});

// The sync payload accepts the same fields as the single-user upsert plus a
// `tokens` object. The token structure comes from apiTokenSyncSchema, so the
// contract stays aligned with the handler validation.
const tokenSyncJson = stripSchemaMeta(toJsonSchema(apiTokenSyncSchema, { target: "openapi-3.0", errorMode: "ignore" }));
const tokenUpsertJson = tokenSyncJson.properties.upsert.items;

const adminTokenUpsertJson = {
    ...tokenUpsertJson,
    properties: {
        name: {
            ...tokenUpsertJson.properties.name,
            description: "Stable token name, unique per user.",
            example: "mcp-readonly",
        },
        token: {
            ...tokenUpsertJson.properties.token,
            description:
                "Raw token value (at least 32 characters). Omit it to let the server generate a value when the token is created.",
            example: "REPLACE_ME_ALICE_MCP_TOKEN_32_CHARS_MIN",
        },
        expires_at: {
            ...tokenUpsertJson.properties.expires_at,
            description:
                "Absolute expiration date. null means the token never expires; omit it to keep the current expiration.",
            example: "2027-06-01T00:00:00Z",
        },
    },
};

const adminTokenSyncJson = {
    ...tokenSyncJson,
    properties: {
        upsert: { ...tokenSyncJson.properties.upsert, items: adminTokenUpsertJson },
        delete: {
            ...tokenSyncJson.properties.delete,
            description: "Token names to delete for this user. Deleting an unknown name is a no-op.",
            example: ["old-token"],
        },
    },
};

const userSyncUpsertBase = annotate(
    stripSchemaMeta(toJsonSchema(userSyncUpsertSchema, { target: "openapi-3.0", errorMode: "ignore" })),
    {
        required: ["email", "display_name"],
        props: upsertAnnotations,
    },
);
const userSyncUpsertJson = {
    ...userSyncUpsertBase,
    properties: {
        ...userSyncUpsertBase.properties,
        tokens: { $ref: "#/components/schemas/AdminTokenSync" },
    },
};

// The runtime schema uses `check` actions that have no JSON Schema equivalent.
// `errorMode: "ignore"` keeps the structural schema and lets the handler enforce
// the path and hash formats.
const contentNodeSyncJson = stripSchemaMeta(
    toJsonSchema(contentNodeSyncSchema, { target: "openapi-3.0", errorMode: "ignore" }),
);
const contentChunkSyncJson = stripSchemaMeta(
    toJsonSchema(contentChunkSyncSchema, { target: "openapi-3.0", errorMode: "ignore" }),
);
const embeddingRequestJson = stripSchemaMeta(
    toJsonSchema(embeddingRequestSchema, { target: "openapi-3.0", errorMode: "ignore" }),
);

export function GET() {
    return Response.json({
        openapi: "3.0.0",
        info: {
            title: "Sklein Bibliography Corpus RAG Manager API",
            version: "1.0.0",
            description: "REST API for Sklein Bibliography Corpus RAG Manager",
        },
        servers: [{ url: "" }],
        paths: {
            "/api/v1/admin/users": {
                get: {
                    summary: "List users (admin)",
                    security: [{ adminBearer: [] }],
                    parameters: [
                        { name: "cursor", in: "query", schema: { type: "string" }, description: "Pagination cursor" },
                        { name: "page_size", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
                    ],
                    responses: {
                        200: {
                            description: "List of users",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: {
                                                type: "array",
                                                items: { $ref: "#/components/schemas/AdminUser" },
                                            },
                                            next_cursor: { type: "string", nullable: true },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
                post: {
                    summary: "Create a user (admin)",
                    description:
                        "email and display_name are required; password is optional (users without one sign in via magic link or reset their password)",
                    security: [{ adminBearer: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: userCreateJson,
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "User created",
                            headers: {
                                Location: {
                                    schema: { type: "string", format: "uri" },
                                    description: "URL of the created user",
                                },
                            },
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/AdminUser" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { $ref: "#/components/responses/BadRequest" },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        409: { $ref: "#/components/responses/Conflict" },
                        422: { $ref: "#/components/responses/Unprocessable" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
                put: {
                    summary: "Upsert a user (admin, idempotent)",
                    description:
                        "Creates the user if no user with this email exists, otherwise fully replaces it. The email is the natural key.",
                    security: [{ adminBearer: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AdminUserUpsert" },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "User created or updated",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/AdminUser" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { $ref: "#/components/responses/BadRequest" },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        409: { $ref: "#/components/responses/Conflict" },
                        422: { $ref: "#/components/responses/Unprocessable" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
            },
            "/api/v1/admin/users/{id}": {
                get: {
                    summary: "Get a user (admin)",
                    security: [{ adminBearer: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                    responses: {
                        200: {
                            description: "User details",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/AdminUser" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        404: { $ref: "#/components/responses/NotFound" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
                patch: {
                    summary: "Update a user (admin, partial)",
                    security: [{ adminBearer: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: userPatchJson,
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "User updated",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/AdminUser" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { $ref: "#/components/responses/BadRequest" },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        404: { $ref: "#/components/responses/NotFound" },
                        409: { $ref: "#/components/responses/Conflict" },
                        422: { $ref: "#/components/responses/Unprocessable" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
                delete: {
                    summary: "Delete a user (admin)",
                    security: [{ adminBearer: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                    responses: {
                        204: { description: "Deleted (no content)" },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        404: { $ref: "#/components/responses/NotFound" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
            },
            "/api/v1/admin/users/sync": {
                put: {
                    summary: "Bulk sync users and API tokens (admin, idempotent)",
                    description:
                        "Upserts the listed users (create or fully replace by email), reconciles their API tokens and deletes the listed emails, all in a single atomic transaction. Deleting a non-existent email or token name is a no-op. Raw token values generated by the server are returned once in raw_tokens.",
                    security: [{ adminBearer: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        upsert: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/AdminUserSyncUpsert" },
                                        },
                                        delete: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                required: ["email"],
                                                properties: {
                                                    email: {
                                                        type: "string",
                                                        format: "email",
                                                        example: "old@example.com",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Users synchronized",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/AdminUserSyncResult" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { $ref: "#/components/responses/BadRequest" },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        409: { $ref: "#/components/responses/Conflict" },
                        422: { $ref: "#/components/responses/Unprocessable" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
            },
            "/api/v1/admin/hierarchical-content-nodes/sync": {
                put: {
                    summary: "Upsert or prune content nodes (admin, idempotent)",
                    description:
                        "Upserts content nodes by slug and optionally deletes rows under a markdown path scope (prune.scope/prune.keep) or a slug scope (prune.scope_slug/prune.keep_slugs). Book imports send the whole tree, parent first, then prune its slug subtree. Structural nodes (work, part) have no markdown_source_file, an empty content and no hash.",
                    security: [{ adminBearer: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ContentNodeSyncRequest" },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Content nodes synchronized",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/ContentNodeSyncResult" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { $ref: "#/components/responses/BadRequest" },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        409: { $ref: "#/components/responses/Conflict" },
                        422: { $ref: "#/components/responses/Unprocessable" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
            },
            "/api/v1/admin/hierarchical-content-nodes/reindex": {
                post: {
                    summary: "Rebuild the BM25 index (admin)",
                    description:
                        "Runs REINDEX INDEX CONCURRENTLY on the ParadeDB BM25 index. The import CLI calls it after inserts, updates or deletes so the mutable segment is converted into immutable segments. Reads and writes continue during the rebuild; on failure an invalid _ccnew index may be left behind.",
                    security: [{ adminBearer: [] }],
                    responses: {
                        200: {
                            description: "Index rebuilt",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/ContentNodeReindexResult" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
            },
            "/api/v1/admin/hierarchical-content-chunks/sync": {
                put: {
                    summary: "Sync chunk embeddings (admin, idempotent)",
                    description:
                        "Replaces all chunks of one Markdown document with the chunks and vectors from its sidecar. The document must already exist, and source_file_hash must match its imported hash.",
                    security: [{ adminBearer: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ContentChunkSyncRequest" },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Chunks imported",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/ContentChunkSyncResult" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { $ref: "#/components/responses/BadRequest" },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        409: { $ref: "#/components/responses/Conflict" },
                        422: { $ref: "#/components/responses/Unprocessable" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
            },
            "/api/v1/admin/embeddings": {
                get: {
                    summary: "Get the embedding model configuration (admin)",
                    security: [{ adminBearer: [] }],
                    responses: {
                        200: {
                            description: "Configured embedding provider",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/EmbeddingInfo" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
                post: {
                    summary: "Generate embeddings for a batch of texts (admin)",
                    description:
                        "The model and dimension come from the server configuration. Set input_type to document for chunks and query for search queries. Vectors are returned in the same order as the input texts.",
                    security: [{ adminBearer: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/EmbeddingRequest" },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Embeddings generated",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: { $ref: "#/components/schemas/EmbeddingResult" },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { $ref: "#/components/responses/BadRequest" },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        422: { $ref: "#/components/responses/Unprocessable" },
                        500: { $ref: "#/components/responses/InternalError" },
                        502: { $ref: "#/components/responses/BadGateway" },
                    },
                },
            },
            "/api/v1/admin/send-test-mail": {
                post: {
                    summary: "Send a test email with hardcoded subject and body (admin)",
                    description:
                        "Only the recipient address can be set — subject and text are hardcoded to prevent abuse.",
                    security: [{ adminBearer: [] }],
                    requestBody: {
                        required: false,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        to: {
                                            type: "string",
                                            format: "email",
                                            example: process.env.TEST_EMAIL_TO || "user@example.com",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Email sent",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            data: {
                                                type: "object",
                                                properties: {
                                                    messageId: { type: "string", example: "<abc123@localhost>" },
                                                    to: { type: "string", format: "email" },
                                                    subject: { type: "string" },
                                                },
                                            },
                                            _links: { $ref: "#/components/schemas/Links" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { $ref: "#/components/responses/BadRequest" },
                        401: { $ref: "#/components/responses/Unauthorized" },
                        500: { $ref: "#/components/responses/InternalError" },
                    },
                },
            },
        },
        components: {
            schemas: {
                Links: {
                    type: "object",
                    properties: {
                        self: {
                            type: "object",
                            properties: { href: { type: "string", format: "uri" } },
                        },
                        collection: {
                            type: "object",
                            properties: { href: { type: "string", format: "uri" } },
                        },
                    },
                },
                AdminUser: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "nano-id-abc123" },
                        email: { type: "string", format: "email", example: "user@example.com" },
                        display_name: { type: "string", example: "John Doe" },
                        oidc_issuer: { type: "string", nullable: true, example: "https://auth.example.com" },
                        oidc_subject: { type: "string", nullable: true, example: "johndoe" },
                        is_active: { type: "boolean", example: true },
                        created_at: { type: "string", format: "date-time", example: "2026-07-11T09:00:00+02:00" },
                        updated_at: { type: "string", format: "date-time", example: "2026-07-11T09:00:00+02:00" },
                    },
                },
                AdminUserUpsert: {
                    ...userUpsertJson,
                },
                AdminUserSyncUpsert: {
                    ...userSyncUpsertJson,
                },
                AdminTokenSync: {
                    ...adminTokenSyncJson,
                },
                AdminRawToken: {
                    type: "object",
                    required: ["email", "name", "token"],
                    properties: {
                        email: { type: "string", format: "email", example: "alice@example.com" },
                        name: { type: "string", example: "mcp-readonly" },
                        token: {
                            type: "string",
                            description:
                                "Raw token value. It is shown only in this response; store it now, it cannot be retrieved later.",
                            example: "VALUE_SHOWN_ONCE",
                        },
                    },
                },
                AdminTokenSyncResult: {
                    type: "object",
                    properties: {
                        created: { type: "integer", example: 1 },
                        updated: { type: "integer", example: 0 },
                        deleted: { type: "integer", example: 0 },
                        unchanged: { type: "integer", example: 2 },
                    },
                },
                UserPatch: {
                    ...userPatchJson,
                },
                AdminUserSyncResult: {
                    type: "object",
                    properties: {
                        created: { type: "integer", example: 1 },
                        updated: { type: "integer", example: 0 },
                        deleted: { type: "integer", example: 0 },
                        tokens: { $ref: "#/components/schemas/AdminTokenSyncResult" },
                        raw_tokens: {
                            type: "array",
                            items: { $ref: "#/components/schemas/AdminRawToken" },
                        },
                        users: {
                            type: "array",
                            items: { $ref: "#/components/schemas/AdminUser" },
                        },
                    },
                },
                ContentNodeSyncRequest: {
                    ...contentNodeSyncJson,
                },
                ContentNodeSyncItem: {
                    type: "object",
                    properties: {
                        nanoid: { type: "string", pattern: "^[0-9a-z]{10}$", example: "a1b2c3d4e5" },
                        slug: {
                            type: "string",
                            example:
                                "mr-phi/2017-05-24_le-principe-de-condorcet-1-2-une-norme-democratique-grain-de-philo-9",
                        },
                        markdown_source_file: {
                            type: "string",
                            nullable: true,
                            example:
                                "books/an-inquiry-into-the-nature-and-causes-of-the-wealth-of-nations-by-smith-and-garnier/markdown/4-book-i-of-the-causes-of-improvement-in-the-productive-powers-of-labour-and-of-the-order-according/01-chap-i-of-the-division-of-labour.md",
                        },
                        action: {
                            type: "string",
                            enum: ["inserted", "updated", "unchanged"],
                        },
                    },
                    required: ["nanoid", "slug", "markdown_source_file", "action"],
                },
                ContentNodeSyncResult: {
                    type: "object",
                    properties: {
                        dry_run: { type: "boolean", example: false },
                        inserted: { type: "integer", example: 1 },
                        updated: { type: "integer", example: 0 },
                        unchanged: { type: "integer", example: 0 },
                        deleted: { type: "integer", example: 0 },
                        items: {
                            type: "array",
                            items: { $ref: "#/components/schemas/ContentNodeSyncItem" },
                        },
                        deleted_paths: {
                            type: "array",
                            items: { type: "string" },
                        },
                        deleted_slugs: {
                            type: "array",
                            items: { type: "string" },
                        },
                    },
                    required: [
                        "dry_run",
                        "inserted",
                        "updated",
                        "unchanged",
                        "deleted",
                        "items",
                        "deleted_paths",
                        "deleted_slugs",
                    ],
                },
                ContentNodeReindexResult: {
                    type: "object",
                    properties: {
                        index: { type: "string", example: "idx_hierarchical_content_nodes_bm25" },
                        mutable: { type: "boolean", example: false },
                        num_docs: { type: "integer", example: 134 },
                        duration_ms: { type: "integer", example: 1200 },
                    },
                    required: ["index", "mutable", "num_docs", "duration_ms"],
                },
                ContentChunkSyncRequest: {
                    ...contentChunkSyncJson,
                },
                ContentChunkSyncResult: {
                    type: "object",
                    properties: {
                        dry_run: { type: "boolean", example: false },
                        source_file: {
                            type: "string",
                            example:
                                "single-document-texts/mr-phi/2017-05-24_le-principe-de-condorcet-1-2-une-norme-democratique-grain-de-philo-9.fr.md",
                        },
                        deleted: { type: "integer", example: 34 },
                        inserted: { type: "integer", example: 34 },
                        chunks: { type: "integer", example: 34 },
                        unchanged: { type: "boolean", example: false },
                    },
                    required: ["dry_run", "source_file", "deleted", "inserted", "chunks", "unchanged"],
                },
                EmbeddingInfo: {
                    type: "object",
                    properties: {
                        provider: { type: "string", example: "voyage" },
                        model: { type: "string", example: "voyage-4" },
                        query_model: { type: "string", example: "voyage-4-lite" },
                        dimension: { type: "integer", example: 1024 },
                    },
                    required: ["provider", "model", "query_model", "dimension"],
                },
                EmbeddingRequest: {
                    ...embeddingRequestJson,
                },
                EmbeddingResult: {
                    type: "object",
                    properties: {
                        provider: { type: "string", example: "voyage" },
                        model: { type: "string", example: "voyage-4" },
                        query_model: { type: "string", example: "voyage-4-lite" },
                        dimension: { type: "integer", example: 1024 },
                        embeddings: {
                            type: "array",
                            items: {
                                type: "array",
                                items: { type: "number" },
                            },
                        },
                        usage: {
                            type: "object",
                            properties: {
                                tokens: { type: "integer", example: 1234 },
                                cost_usd: {
                                    type: "number",
                                    nullable: true,
                                    example: 0.00007404,
                                    description:
                                        "Estimated cost at list price in US dollars; null when the model has no configured price",
                                },
                                cost_basis: { type: "string", example: "list_price" },
                                price_per_million_tokens_usd: {
                                    type: "number",
                                    nullable: true,
                                    example: 0.06,
                                },
                            },
                            required: ["tokens", "cost_usd", "cost_basis", "price_per_million_tokens_usd"],
                        },
                    },
                    required: ["provider", "model", "query_model", "dimension", "embeddings", "usage"],
                },
                ProblemDetail: {
                    type: "object",
                    properties: {
                        type: { type: "string", format: "uri", example: "about:blank" },
                        title: { type: "string" },
                        status: { type: "integer" },
                        detail: { type: "string" },
                        instance: { type: "string", format: "uri" },
                    },
                },
            },
            responses: {
                BadRequest: {
                    description: "Bad Request",
                    content: {
                        "application/problem+json": {
                            schema: { $ref: "#/components/schemas/ProblemDetail" },
                        },
                    },
                },
                Unauthorized: {
                    description: "Unauthorized",
                    content: {
                        "application/problem+json": {
                            schema: { $ref: "#/components/schemas/ProblemDetail" },
                        },
                    },
                },
                NotFound: {
                    description: "Not Found",
                    content: {
                        "application/problem+json": {
                            schema: { $ref: "#/components/schemas/ProblemDetail" },
                        },
                    },
                },
                Conflict: {
                    description: "Conflict",
                    content: {
                        "application/problem+json": {
                            schema: { $ref: "#/components/schemas/ProblemDetail" },
                        },
                    },
                },
                Unprocessable: {
                    description: "Unprocessable Entity",
                    content: {
                        "application/problem+json": {
                            schema: { $ref: "#/components/schemas/ProblemDetail" },
                        },
                    },
                },
                InternalError: {
                    description: "Internal Server Error",
                    content: {
                        "application/problem+json": {
                            schema: { $ref: "#/components/schemas/ProblemDetail" },
                        },
                    },
                },
                BadGateway: {
                    description: "Bad Gateway",
                    content: {
                        "application/problem+json": {
                            schema: { $ref: "#/components/schemas/ProblemDetail" },
                        },
                    },
                },
            },
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    description: "API token generated from /my/tokens or create-api-token CLI",
                },
                adminBearer: {
                    type: "http",
                    scheme: "bearer",
                    description:
                        "Super admin token set via SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN environment variable",
                },
            },
        },
    });
}
