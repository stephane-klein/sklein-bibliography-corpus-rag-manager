import { sql } from "#lib/server/pg.js";

// Reads the whole book that holds one content node, in reading order, with the
// lean columns needed for the breadcrumb and the previous/next links.
//
// The ancestry walk finds the book root. The subtree walk then returns every
// node below that root, ordered by the importer's (position, id) path, so a
// parent always sorts before its children and two siblings keep their order.
export async function loadBookNavigation(nodeId) {
    const rows = await sql`
        WITH RECURSIVE ancestry AS (
            SELECT id, parent_id
              FROM hierarchical_content_nodes
             WHERE id = ${nodeId}
            UNION ALL
            SELECT parent.id, parent.parent_id
              FROM hierarchical_content_nodes parent
              JOIN ancestry ON ancestry.parent_id = parent.id
        ),
        book AS (
            SELECT node.id, node.parent_id, node.nanoid, node.title,
                   node.markdown_source_file IS NOT NULL AS is_file,
                   ARRAY[node.position, node.id] AS path
              FROM hierarchical_content_nodes node
             WHERE node.id = (SELECT id FROM ancestry WHERE parent_id IS NULL)
            UNION ALL
            SELECT child.id, child.parent_id, child.nanoid, child.title,
                   child.markdown_source_file IS NOT NULL,
                   book.path || ARRAY[child.position, child.id]
              FROM hierarchical_content_nodes child
              JOIN book ON child.parent_id = book.id
        )
        SELECT id, parent_id, nanoid, title, is_file
          FROM book
         ORDER BY path
    `;

    return buildBookNavigation(rows, nodeId);
}

// Turns the flat, reading-ordered rows of one book into the links the page
// needs. Rows must arrive in reading order, which ORDER BY path guarantees.
export function buildBookNavigation(rows, nodeId) {
    const currentIndex = rows.findIndex((row) => row.id === nodeId);

    if (currentIndex === -1) {
        return null;
    }

    const byId = new Map(rows.map((row) => [row.id, row]));

    // Walk up from the current node to the book root, then reverse the list
    // so it reads from the book down to the parent.
    const chain = [];
    let cursor = byId.get(nodeId);

    while (cursor) {
        chain.push(cursor);
        cursor = cursor.parent_id === null ? null : byId.get(cursor.parent_id);
    }

    chain.reverse();

    // The book root is the whole book: its page is a table of contents, so it
    // has no parent and no previous or next page.
    const isNested = chain.length > 1;
    const previous = isNested ? findNeighbour(rows, currentIndex, -1) : null;
    const next = isNested ? findNeighbour(rows, currentIndex, 1) : null;

    return {
        book: toLink(chain[0]),
        // The breadcrumb keeps the intermediate levels only: the book has its
        // own line, and the current page is the heading.
        ancestors: chain.slice(1, -1).map((row) => toLink(row)),
        parent: isNested ? toLink(chain[chain.length - 2]) : null,
        previous: previous === null ? null : toLink(previous),
        next: next === null ? null : toLink(next),
    };
}

// Looks for the nearest node that holds text in one direction. A container
// only shows a table of contents, so it never becomes a previous or next page.
function findNeighbour(rows, currentIndex, step) {
    for (let index = currentIndex + step; index >= 0 && index < rows.length; index += step) {
        if (rows[index].is_file) {
            return rows[index];
        }
    }

    return null;
}

function toLink(row) {
    return { id: row.id, nanoid: row.nanoid, title: row.title };
}
