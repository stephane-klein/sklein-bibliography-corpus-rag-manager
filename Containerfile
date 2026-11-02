FROM node:26-slim AS build

RUN npm install -g pnpm@12.16.1

WORKDIR /app/

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

ARG GIT_HASH=unknown
ARG GIT_BRANCH=unknown
ARG GIT_DATE=unknown
ARG BUILD_STAMP=unknown

ENV PUBLIC_GIT_HASH=$GIT_HASH \
    PUBLIC_GIT_BRANCH=$GIT_BRANCH \
    PUBLIC_GIT_DATE=$GIT_DATE \
    PUBLIC_BUILD_STAMP=$BUILD_STAMP

COPY . .
RUN pnpm build

# ─────────────────────────────────────────────────────
FROM node:26-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@12.16.1

WORKDIR /app/

ENV PATH="/app/node_modules/.bin:${PATH}"
ENV NODE_ENV=production
ENV SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_URL="postgres://postgres:postgres@postgres:5432/postgres"
ENV SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_SCHEMA="public"
ENV SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_ADMIN_TOKEN=""
ENV BODY_SIZE_LIMIT=50M
ENV OPTIMIZE_FOR_MEMORY_SIZE=""

ARG GIT_HASH=unknown
ARG GIT_BRANCH=unknown
ARG GIT_DATE=unknown
ARG BUILD_STAMP=unknown

ENV PUBLIC_GIT_HASH=$GIT_HASH \
    PUBLIC_GIT_BRANCH=$GIT_BRANCH \
    PUBLIC_GIT_DATE=$GIT_DATE \
    PUBLIC_BUILD_STAMP=$BUILD_STAMP

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/build/ ./build/
COPY src/ ./src/
COPY sqls/ ./sqls/
COPY entrypoint.sh /entrypoint.sh

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/-/healthy || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["serve"]
