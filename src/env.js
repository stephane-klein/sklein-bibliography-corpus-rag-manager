import { defineEnvVars } from "@sveltejs/kit/env";
import * as v from "valibot";

// These variables are injected at build time (Containerfile) and at runtime
// (scripts/export-git-env.sh), so they are optional here. Call sites keep
// their own fallbacks, e.g. `PUBLIC_BUILD_STAMP ?? "—"`.
export const variables = defineEnvVars({
    PUBLIC_GIT_BRANCH: { public: true, schema: v.optional(v.string()) },
    PUBLIC_GIT_DATE: { public: true, schema: v.optional(v.string()) },
    PUBLIC_BUILD_STAMP: { public: true, schema: v.optional(v.string()) },
    PUBLIC_GIT_HASH: { public: true, schema: v.optional(v.string()) },
    PUBLIC_REPO_URL: { public: true, schema: v.optional(v.string()) },
});
