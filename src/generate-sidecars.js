#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { countTokens } from "gpt-tokenizer/encoding/cl100k_base";
import * as yaml from "js-yaml";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { logger } from "./lib/server/logger.js";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENTS_ROOT = join(PROJECT_ROOT, "contents");
const ALLOWED_ROOT = join(CONTENTS_ROOT, "single-document-texts");
const DEFAULT_PATH = "contents/single-document-texts";
const SCHEMA_VERSION = 1;
const TOKENIZER = "cl100k_base";
const MAX_CHUNK_TOKENS = 1000;
const SPLITTER = "sentences";
const SENTENCE_SEGMENTER = new Intl.Segmenter("fr", { granularity: "sentence" });

const argv = yargs(hideBin(process.argv))
    .option("path", {
        type: "string",
        default: DEFAULT_PATH,
        description: "Markdown file or directory under contents/single-document-texts",
    })
    .option("dry-run", {
        type: "boolean",
        default: false,
        description: "Report what would be written without writing",
    })
    .option("force", {
        type: "boolean",
        default: false,
        description: "Regenerate sidecars even when the manifest matches",
    })
    .parse();

const importTarget = resolve(PROJECT_ROOT, argv.path);
const relativeToAllowed = relative(ALLOWED_ROOT, importTarget);
const outsideAllowedRoot =
    relativeToAllowed === ".." || relativeToAllowed.startsWith(`..${sep}`) || isAbsolute(relativeToAllowed);

if (outsideAllowedRoot) {
    logger.error({ path: argv.path }, "Path must be inside contents/single-document-texts");
    process.exit(1);
}

let targetStat;

try {
    targetStat = await stat(importTarget);
} catch (error) {
    logger.error({ path: argv.path, code: error.code }, "Path does not exist");
    process.exit(1);
}

const isDirectory = targetStat.isDirectory();

if (!isDirectory && !targetStat.isFile()) {
    logger.error({ path: argv.path }, "Path must be a Markdown file or a directory");
    process.exit(1);
}

if (!isDirectory && (!importTarget.endsWith(".md") || importTarget.endsWith(".dialogue.md"))) {
    logger.error({ path: argv.path }, "File must be a Markdown file, excluding *.dialogue.md");
    process.exit(1);
}

const directoryRoot = isDirectory ? importTarget : dirname(importTarget);
const fileNames = isDirectory
    ? (await readdir(directoryRoot, { recursive: true }))
          .filter((fileName) => fileName.endsWith(".md") && !fileName.endsWith(".dialogue.md"))
          .sort()
    : [basename(importTarget)];

if (fileNames.length === 0) {
    logger.error({ path: argv.path }, "No Markdown files found");
    process.exit(1);
}

logger.info(
    { path: argv.path, kind: isDirectory ? "directory" : "file", files: fileNames.length },
    "Found Markdown files",
);

const counts = { written: 0, skipped: 0, chunks: 0 };

try {
    for (const fileName of fileNames) {
        const absolutePath = join(directoryRoot, fileName);
        const relativeToContents = relative(CONTENTS_ROOT, absolutePath).split(sep).join("/");
        const sidecarPath = `${absolutePath}.yaml`;
        const raw = await readFile(absolutePath);
        const manifest = {
            type: "manifest",
            schema_version: SCHEMA_VERSION,
            source_file: relativeToContents,
            source_file_hash: `sha256:${createHash("sha256").update(raw).digest("hex")}`,
            tokenizer: TOKENIZER,
            max_chunk_tokens: MAX_CHUNK_TOKENS,
            splitter: SPLITTER,
        };
        const existing = argv.force ? null : await readSidecar(sidecarPath);

        if (isUnchangedManifest(manifest, existing)) {
            counts.skipped += 1;
            logger.info({ file: relativeToContents, chunks: existing.manifest.chunk_count }, "Sidecar unchanged");
            continue;
        }

        const { frontmatter, body } = parseMarkdown(raw.toString("utf8"));
        const title = titleOf(frontmatter, body, basename(absolutePath, ".md"));
        const chunks = chunkMarkdown(body, title);
        manifest.chunk_count = chunks.length;

        if (argv.dryRun) {
            counts.written += 1;
            counts.chunks += chunks.length;
            logger.info(
                { file: relativeToContents, chunks: chunks.length, forced: argv.force },
                "Sidecar would be written",
            );
            continue;
        }

        await writeSidecar(sidecarPath, manifest, chunks);
        counts.written += 1;
        counts.chunks += chunks.length;
        logger.info(
            { file: relativeToContents, sidecar: `${relativeToContents}.yaml`, chunks: chunks.length },
            "Sidecar generated",
        );
    }
} catch (error) {
    logger.error({ err: error }, "Sidecar generation failed");
    process.exit(1);
}

logger.info(
    {
        path: argv.path,
        kind: isDirectory ? "directory" : "file",
        files: fileNames.length,
        written: counts.written,
        skipped: counts.skipped,
        chunks: counts.chunks,
        dry_run: argv.dryRun,
        forced: argv.force,
    },
    "Sidecar generation done",
);

function chunkMarkdown(body, title) {
    return parseBlocks(body, title)
        .flatMap((block) => splitBlock(block))
        .map((chunk, index) => ({
            chunk_index: index,
            heading_path: chunk.headingPath,
            content_token_count: chunk.tokenCount,
            text: chunk.text,
        }));
}

function parseBlocks(body, title) {
    const blocks = [];
    const headingStack = [];
    let currentLines = [];
    let currentHeadingPath = title;
    let fenceMarker = null;

    const flush = () => {
        if (currentLines.length > 0) {
            blocks.push({ text: currentLines.join("\n"), headingPath: currentHeadingPath });
            currentLines = [];
        }
    };

    for (const line of body.split(/\r?\n/)) {
        const trimmed = line.trim();

        if (fenceMarker !== null) {
            currentLines.push(line);
            if (trimmed.startsWith(fenceMarker)) {
                fenceMarker = null;
            }
            continue;
        }

        if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
            flush();
            fenceMarker = trimmed.slice(0, 3);
            currentLines.push(line);
            continue;
        }

        if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
            flush();
            continue;
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.*?)\s*$/);

        if (headingMatch) {
            flush();
            const level = headingMatch[1].length;
            const headingText = headingMatch[2].trim();

            if (level > 1 && headingText) {
                headingStack.length = Math.min(headingStack.length, level - 2);
                headingStack[level - 2] = headingText;
                currentHeadingPath = [title, ...headingStack.filter(Boolean)].join(" > ");
            }

            continue;
        }

        if (trimmed === "") {
            flush();
            continue;
        }

        currentLines.push(line);
    }

    flush();
    return blocks;
}

function splitBlock(block) {
    const text = block.text.trim();

    if (!text) {
        return [];
    }

    const tokenCount = countTokens(text);

    if (tokenCount <= MAX_CHUNK_TOKENS) {
        return [{ headingPath: block.headingPath, text, tokenCount }];
    }

    return splitLongText(text).map((chunkText) => ({
        headingPath: block.headingPath,
        text: chunkText,
        tokenCount: countTokens(chunkText),
    }));
}

function splitLongText(text) {
    const sentences = splitSentences(text);
    const chunks = [];
    let current = "";
    let lastSentence = "";

    for (const sentence of sentences) {
        if (!sentence.trim()) {
            continue;
        }

        if (countTokens(sentence) > MAX_CHUNK_TOKENS) {
            if (current) {
                chunks.push(current.trim());
                current = "";
                lastSentence = "";
            }
            chunks.push(...splitByWords(sentence));
            continue;
        }

        if (!current) {
            current = sentence;
            lastSentence = sentence;
            continue;
        }

        const candidate = current + sentence;

        if (countTokens(candidate) <= MAX_CHUNK_TOKENS) {
            current = candidate;
            lastSentence = sentence;
            continue;
        }

        chunks.push(current.trim());
        const withOverlap = lastSentence + sentence;
        current = countTokens(withOverlap) <= MAX_CHUNK_TOKENS ? withOverlap : sentence;
        lastSentence = sentence;
    }

    if (current) {
        chunks.push(current.trim());
    }

    return chunks;
}

function splitSentences(text) {
    // Replace soft line breaks with spaces before segmentation. The offsets stay
    // identical, so each sentence is sliced from the original text and keeps its
    // line breaks.
    const normalized = text.replace(/\n/g, " ");

    return Array.from(SENTENCE_SEGMENTER.segment(normalized), (segment) =>
        text.slice(segment.index, segment.index + segment.segment.length),
    );
}

function splitByWords(text) {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks = [];
    let current = "";

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;

        if (current && countTokens(candidate) > MAX_CHUNK_TOKENS) {
            chunks.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

async function readSidecar(sidecarPath) {
    try {
        const document = yaml.load(await readFile(sidecarPath, "utf8"));

        return document && typeof document === "object" && !Array.isArray(document) ? document : null;
    } catch (error) {
        if (error.code !== "ENOENT") {
            logger.warn({ sidecar: sidecarPath, err: error }, "Could not read existing sidecar");
        }
        return null;
    }
}

function isUnchangedManifest(manifest, existing) {
    const existingManifest = existing?.manifest;

    return (
        existingManifest !== undefined &&
        typeof existingManifest === "object" &&
        existingManifest !== null &&
        existingManifest.type === manifest.type &&
        existingManifest.schema_version === manifest.schema_version &&
        existingManifest.source_file === manifest.source_file &&
        existingManifest.source_file_hash === manifest.source_file_hash &&
        existingManifest.tokenizer === manifest.tokenizer &&
        existingManifest.max_chunk_tokens === manifest.max_chunk_tokens &&
        existingManifest.splitter === manifest.splitter &&
        typeof existingManifest.chunk_count === "number" &&
        Array.isArray(existing.chunks) &&
        existing.chunks.length === existingManifest.chunk_count
    );
}

async function writeSidecar(sidecarPath, manifest, chunks) {
    const content = yaml.dump({ manifest, chunks }, { lineWidth: -1, noRefs: true, sortKeys: false });
    const temporaryPath = `${sidecarPath}.${process.pid}.tmp`;

    try {
        await writeFile(temporaryPath, content, "utf8");
        await rename(temporaryPath, sidecarPath);
    } finally {
        await unlink(temporaryPath).catch(() => {});
    }
}

function parseMarkdown(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

    if (!match) {
        return { frontmatter: {}, body: text };
    }

    const parsed = yaml.load(match[1]);
    const frontmatter = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};

    return { frontmatter, body: text.slice(match[0].length) };
}

function titleOf(frontmatter, body, fallback) {
    if (typeof frontmatter.video_title === "string" && frontmatter.video_title.trim()) {
        return frontmatter.video_title.trim();
    }

    const heading = body.match(/^#\s+(.+?)\s*$/m);

    return heading ? heading[1].trim() : fallback;
}
