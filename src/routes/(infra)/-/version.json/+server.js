import { PUBLIC_GIT_BRANCH, PUBLIC_GIT_DATE, PUBLIC_BUILD_STAMP, PUBLIC_GIT_HASH } from "$app/env/public";

export function GET() {
    return Response.json({
        environment: process.env.NODE_ENV || "development",
        branch: PUBLIC_GIT_BRANCH ?? null,
        gitDate: PUBLIC_GIT_DATE ?? null,
        buildStamp: PUBLIC_BUILD_STAMP ?? null,
        gitHash: PUBLIC_GIT_HASH ?? null,
    });
}
