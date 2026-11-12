import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, sep } from "node:path";
import * as yaml from "js-yaml";

// A book directory is a directory with a toc.yaml. A parent directory such as
// contents/books is accepted too: discoverBooks looks one level below it.
export async function discoverBooks(target) {
    if (await pathExists(join(target, "toc.yaml"))) {
        return [target];
    }

    const entries = await readdir(target, { withFileTypes: true });
    const discovered = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        const bookDir = join(target, entry.name);

        if (await pathExists(join(bookDir, "toc.yaml"))) {
            discovered.push(bookDir);
        }
    }

    if (discovered.length === 0) {
        throw new Error(`No book with a toc.yaml found under ${target}`);
    }

    return discovered.sort();
}

export async function loadBook(bookDir) {
    const configPath = join(bookDir, "config.yaml");
    const tocPath = join(bookDir, "toc.yaml");

    const config = (await pathExists(configPath)) ? (yaml.load(await readFile(configPath, "utf8")) ?? {}) : {};
    const toc = yaml.load(await readFile(tocPath, "utf8"));

    if (!toc || typeof toc !== "object" || Array.isArray(toc)) {
        throw new Error(`Invalid toc.yaml: ${tocPath}`);
    }

    const markdownDir = join(bookDir, "markdown");
    const fileNames = (await readdir(markdownDir, { recursive: true }))
        .filter((fileName) => fileName.endsWith(".md"))
        .sort();
    const filesByPath = new Map();

    for (const fileName of fileNames) {
        const absolutePath = join(markdownDir, fileName);
        const raw = await readFile(absolutePath);
        const { frontmatter, body } = parseMarkdown(raw.toString("utf8"));
        const relativePath = fileName.split(sep).join("/");
        const tocPathKey =
            typeof frontmatter.path === "string" && frontmatter.path.trim()
                ? frontmatter.path.trim()
                : relativePath.replace(/\.md$/, "");

        filesByPath.set(tocPathKey, { relativePath, raw, frontmatter, body });
    }

    return { config, toc, filesByPath, bookDirName: basename(bookDir) };
}

export function parseMarkdown(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

    if (!match) {
        return { frontmatter: {}, body: text };
    }

    const parsed = yaml.load(match[1]);
    const frontmatter = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};

    return { frontmatter, body: text.slice(match[0].length) };
}

export async function pathExists(path) {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}
