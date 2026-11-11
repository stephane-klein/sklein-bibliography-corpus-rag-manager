import { readFile, rename, unlink, writeFile } from "node:fs/promises";

const FORMAT = "float32le";
const FORMAT_VERSION = 1;
const FLOAT_BYTES = 4;

export async function readEmbeddingsFile(filePath) {
    return decodeEmbeddingsFile(await readFile(filePath));
}

export async function writeEmbeddingsFile(filePath, { header, embeddings }) {
    const content = encodeEmbeddingsFile({ header, embeddings });
    const temporaryPath = `${filePath}.${process.pid}.tmp`;

    try {
        await writeFile(temporaryPath, content);
        await rename(temporaryPath, filePath);
    } finally {
        await unlink(temporaryPath).catch(() => {});
    }
}

export function encodeEmbeddingsFile({ header, embeddings }) {
    const validatedHeader = validateHeader(header);
    validateEmbeddings(embeddings, validatedHeader);

    const buffer = Buffer.alloc(
        Buffer.byteLength(JSON.stringify(validatedHeader)) +
            1 +
            embeddings.length * validatedHeader.dimension * FLOAT_BYTES,
    );

    const headerLength = buffer.write(`${JSON.stringify(validatedHeader)}\n`, 0, "utf8");
    let offset = headerLength;

    for (const embedding of embeddings) {
        for (const value of embedding) {
            buffer.writeFloatLE(value, offset);
            offset += FLOAT_BYTES;
        }
    }

    return buffer;
}

export function decodeEmbeddingsFile(buffer) {
    const headerEnd = buffer.indexOf(0x0a);

    if (headerEnd === -1) {
        throw new Error("Embeddings file has no header line");
    }

    const header = validateHeader(JSON.parse(buffer.subarray(0, headerEnd).toString("utf8")));
    const expectedBytes = header.chunk_count * header.dimension * FLOAT_BYTES;
    const payload = buffer.subarray(headerEnd + 1);

    if (payload.byteLength !== expectedBytes) {
        throw new Error(`Embeddings payload must be ${expectedBytes} bytes, got ${payload.byteLength}`);
    }

    const arrayBuffer = payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength);
    const values = new Float32Array(arrayBuffer);

    for (const value of values) {
        if (!Number.isFinite(value)) {
            throw new Error("Embeddings payload contains a non-finite value");
        }
    }

    return {
        header,
        embeddings: Array.from({ length: header.chunk_count }, (_, index) =>
            values.subarray(index * header.dimension, (index + 1) * header.dimension),
        ),
    };
}

function validateHeader(header) {
    if (!header || typeof header !== "object" || Array.isArray(header)) {
        throw new Error("Embeddings header must be an object");
    }

    if (header.format !== FORMAT) {
        throw new Error(`Embeddings header format must be ${FORMAT}`);
    }

    if (header.format_version !== FORMAT_VERSION) {
        throw new Error(`Embeddings header format_version must be ${FORMAT_VERSION}`);
    }

    if (typeof header.model !== "string" || !header.model.trim()) {
        throw new Error("Embeddings header model must be a non-empty string");
    }

    if (!Number.isInteger(header.dimension) || header.dimension <= 0) {
        throw new Error("Embeddings header dimension must be a positive integer");
    }

    if (!Number.isInteger(header.chunk_count) || header.chunk_count < 0) {
        throw new Error("Embeddings header chunk_count must be a non-negative integer");
    }

    if (typeof header.source_file_hash !== "string" || !/^sha256:[0-9a-f]{64}$/.test(header.source_file_hash)) {
        throw new Error("Embeddings header source_file_hash must use the sha256:<64 hex> format");
    }

    if (typeof header.input_format !== "string" || !header.input_format.trim()) {
        throw new Error("Embeddings header input_format must be a non-empty string");
    }

    if (header.cost !== undefined && header.cost !== null) {
        validateCost(header.cost);
    }

    return header;
}

function validateCost(cost) {
    if (typeof cost !== "object" || Array.isArray(cost)) {
        throw new Error("Embeddings header cost must be an object");
    }

    if (typeof cost.amount_usd !== "number" || !Number.isFinite(cost.amount_usd) || cost.amount_usd < 0) {
        throw new Error("Embeddings header cost.amount_usd must be a non-negative number");
    }

    if (!Number.isInteger(cost.tokens) || cost.tokens < 0) {
        throw new Error("Embeddings header cost.tokens must be a non-negative integer");
    }

    if (typeof cost.basis !== "string" || !cost.basis.trim()) {
        throw new Error("Embeddings header cost.basis must be a non-empty string");
    }

    if (
        typeof cost.price_per_million_tokens_usd !== "number" ||
        !Number.isFinite(cost.price_per_million_tokens_usd) ||
        cost.price_per_million_tokens_usd < 0
    ) {
        throw new Error("Embeddings header cost.price_per_million_tokens_usd must be a non-negative number");
    }
}

function validateEmbeddings(embeddings, header) {
    if (!Array.isArray(embeddings) || embeddings.length !== header.chunk_count) {
        throw new Error(`Embeddings must contain ${header.chunk_count} vectors`);
    }

    for (const embedding of embeddings) {
        if (embedding.length !== header.dimension) {
            throw new Error(`Embedding must have ${header.dimension} dimensions, got ${embedding.length}`);
        }

        for (const value of embedding) {
            if (!Number.isFinite(value)) {
                throw new Error("Embedding contains a non-finite value");
            }
        }
    }
}
