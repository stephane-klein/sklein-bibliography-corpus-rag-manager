// Builds the document tree of one book from its toc.yaml and the Markdown
// files found under markdown/. The function is pure: the caller reads the
// files and passes them in, which keeps the tree rules testable.
//
// A toc entry becomes a node when it has a Markdown file, or when at least
// one of its descendants has one. Entries below the split depth and excluded
// files therefore stay inside their parent file and create no node.

export function buildBookTree({ toc, config, filesByPath }) {
    const rootSlug = config?.slug;

    if (
        typeof rootSlug !== "string" ||
        rootSlug.length === 0 ||
        rootSlug.includes("/") ||
        rootSlug.split("/").includes("..")
    ) {
        throw new Error("config.yaml must define a single-segment slug");
    }

    if (typeof toc?.title !== "string" || toc.title.length === 0) {
        throw new Error("toc.yaml must define a title");
    }

    const excluded = new Set(config.exclude ?? []);
    const bibliography = config.bibliography ?? {};

    function fileFor(tocNode) {
        const file = filesByPath.get(tocNode.path);

        if (!file) {
            return null;
        }

        if (excluded.has(`${tocNode.path}.md`) || excluded.has(file.relativePath)) {
            return null;
        }

        return file;
    }

    function filterNode(tocNode) {
        if (typeof tocNode.path !== "string" || tocNode.path.length === 0) {
            throw new Error(`toc.yaml entry without path: ${tocNode.title}`);
        }

        const file = fileFor(tocNode);
        const children = (tocNode.children ?? []).map((child) => filterNode(child)).filter((child) => child !== null);

        if (!file && children.length === 0) {
            return null;
        }

        return { tocNode, file, children };
    }

    const rootChildren = (toc.toc ?? []).map((node) => filterNode(node)).filter((node) => node !== null);
    const root = {
        slug: rootSlug,
        parent_slug: null,
        depth: 0,
        position: 0,
        title: toc.title,
        content: "",
        file: null,
        metadata: {
            bibliography,
            breadcrumb: [toc.title],
            toc: { title: toc.title },
        },
    };
    const nodes = [root];

    function add(node, parent, depth, position, breadcrumb) {
        const { tocNode, file, children } = node;
        const nodeBreadcrumb = [...breadcrumb, tocNode.title];
        const entry = {
            slug: `${rootSlug}/${tocNode.path}`,
            parent_slug: parent.slug,
            depth,
            position,
            title: tocNode.title,
            content: file?.body ?? "",
            file,
            metadata: {
                ...(file?.frontmatter ?? {}),
                breadcrumb: nodeBreadcrumb,
                toc: {
                    title: tocNode.title,
                    path: tocNode.path,
                    href: tocNode.href ?? null,
                },
            },
        };

        nodes.push(entry);
        children.forEach((child, index) => add(child, entry, depth + 1, index, nodeBreadcrumb));
    }

    rootChildren.forEach((child, index) => add(child, root, 1, index, [toc.title]));

    const seen = new Set();

    for (const node of nodes) {
        if (seen.has(node.slug)) {
            throw new Error(`duplicate node slug: ${node.slug}`);
        }
        seen.add(node.slug);
    }

    return nodes;
}
