import { redirect } from "@sveltejs/kit";

import { getMcpAccessLogPageData } from "#lib/server/mcp-access-log.js";

const PAGE_SIZE = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

function formatDate(date) {
    return DATE_FORMATTER.format(date);
}

function shiftDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function load({ url, locals }) {
    // Layout and page loads run in parallel; the (private) layout redirect is
    // not guaranteed to have run before this loader.
    if (!locals.user) {
        throw redirect(302, "/login");
    }

    const today = formatDate(new Date());
    const defaultFrom = formatDate(shiftDays(new Date(), -30));
    const yesterday = formatDate(shiftDays(new Date(), -1));
    const last7Days = formatDate(shiftDays(new Date(), -6));
    const thisMonth = `${today.slice(0, 7)}-01`;

    const all = url.searchParams.get("all") === "1";
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const validRange = DATE_RE.test(fromParam ?? "") && DATE_RE.test(toParam ?? "");
    const from = all ? null : validRange ? fromParam : defaultFrom;
    const to = all ? null : validRange ? toParam : today;

    const pageRaw = Number(url.searchParams.get("page") || "1");
    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    const data = await getMcpAccessLogPageData({
        from,
        to,
        page,
        pageSize: PAGE_SIZE,
        userId: locals.user.id,
    });

    return {
        ...data,
        all,
        pageSize: PAGE_SIZE,
        presets: [
            { key: "today", href: `?from=${today}&to=${today}` },
            { key: "yesterday", href: `?from=${yesterday}&to=${yesterday}` },
            { key: "last_7_days", href: `?from=${last7Days}&to=${today}` },
            { key: "last_30_days", href: `?from=${defaultFrom}&to=${today}` },
            { key: "this_month", href: `?from=${thisMonth}&to=${today}` },
            { key: "all_time", href: "?all=1" },
        ],
    };
}
