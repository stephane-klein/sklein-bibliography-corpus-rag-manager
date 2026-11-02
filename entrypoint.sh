#!/bin/sh

set -e

OPTIMIZE_FOR_MEMORY_SIZE="${OPTIMIZE_FOR_MEMORY_SIZE:-}"
_NODE_FLAGS=""
if [ "$OPTIMIZE_FOR_MEMORY_SIZE" = "true" ] || [ "$OPTIMIZE_FOR_MEMORY_SIZE" = "1" ]; then
    _NODE_FLAGS="--optimize-for-size --max-semi-space-size=2"
fi

COMMAND=${1:-""}

case "$COMMAND" in
    migrate)
        node $_NODE_FLAGS src/migrate.js
        ;;
    seed)
        node $_NODE_FLAGS src/migrate.js
        node $_NODE_FLAGS src/seed.js
        ;;
    add-user)
        shift
        exec node $_NODE_FLAGS src/add-user.js "$@"
        ;;
    create-api-token)
        shift
        exec node $_NODE_FLAGS src/create-api-token.js "$@"
        ;;
    serve|"")
        node $_NODE_FLAGS src/migrate.js
        exec node $_NODE_FLAGS /app/build/index.js
        ;;
    *)
        exec "$@"
        ;;
esac
