import adapter from "@sveltejs/adapter-node";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { sveltekit } from "@sveltejs/kit/vite";
import UnoCSS from "unocss/vite";

// `trustedOrigins: ["*"]` disables SvelteKit's CSRF origin check. SvelteKit
// resolves the wildcard at build time, so this variable only matters for
// `vite build` — `vite preview` serves an already-built bundle.
const trustAllOrigins = process.env.CSRF_TRUSTED_ORIGINS === "*";

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        UnoCSS(),
        sveltekit({
            adapter: adapter(),
            csrf: { trustedOrigins: trustAllOrigins ? ["*"] : [] },
        }),
        paraglideVitePlugin({
            project: "./project.inlang",
            outdir: "./src/lib/paraglide",
            strategy: ["baseLocale"],
        }),
    ],
    server: { host: "0.0.0.0", allowedHosts: true },
};

export default config;
