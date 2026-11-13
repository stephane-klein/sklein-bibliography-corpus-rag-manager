import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";

// The corpus comes from EPUB files: an index entry links to a page of the
// original edition, not to a page of this application. Such a link has no
// target here, so the page number stays visible and the link is defused.
const epubPageHref = /^[^:/?#]+\.x?html?(?:[#?]|$)/i;

const md = new MarkdownIt({
    // Content is imported from local files, but raw HTML is never part of it.
    html: false,
    linkify: false,
    // The corpus already holds typographic apostrophes and uses straight
    // quotes for inches: typographer would turn 6" into 6”.
    typographer: false,
}).use(footnote);

md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n';
md.renderer.rules.table_close = () => "</table></div>\n";

// The ref is already wrapped in <sup>, so the caption is a bare number.
md.renderer.rules.footnote_caption = (tokens, idx) => String(tokens[idx].meta.id + 1);

const renderLinkOpen =
    md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet("href");

    if (href && epubPageHref.test(href)) {
        tokens[idx].attrs = tokens[idx].attrs.filter(([name]) => name !== "href");
        tokens[idx].attrSet("class", "page-ref");
    }

    return renderLinkOpen(tokens, idx, options, env, self);
};

export function renderMarkdown(source) {
    return source ? md.render(source) : "";
}
