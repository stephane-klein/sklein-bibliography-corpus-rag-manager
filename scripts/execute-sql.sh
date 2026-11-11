#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

mode="read"

case "${1:-}" in
    --read)
        shift
        ;;
    --write)
        mode="write"
        shift
        ;;
    *)
        echo "Usage: $0 [--read|--write] <SQL>" >&2
        exit 64
        ;;
esac

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 [--read|--write] <SQL>" >&2
    exit 64
fi

url="${SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_URL:-}"

if [ -z "$url" ] && [ "${_SKLEIN_EXECUTE_SQL_ENV_LOADED:-}" != "1" ]; then
    # When the script is called directly, ask mise to load the project
    # environment once. The guard above stops the recursion when the container
    # is stopped and the URL stays empty.
    export _SKLEIN_EXECUTE_SQL_ENV_LOADED=1
    exec mise exec -- "$0" "--${mode}" "$@"
fi

if [ -z "$url" ]; then
    echo "PostgreSQL is not reachable: SKLEIN_BIBLIOGRAPHY_CORPUS_RAG_MANAGER_POSTGRES_URL is empty." >&2
    echo "Start the container with: pitchfork start postgres" >&2
    exit 1
fi

common_options="-c statement_timeout=15000 -c lock_timeout=5000 -c paradedb.planner_warnings=off"

if [ "$mode" = "read" ]; then
    export PGOPTIONS="-c default_transaction_read_only=on ${common_options}"
else
    export PGOPTIONS="${common_options}"
fi

exec psql "$url" -X -v ON_ERROR_STOP=1 -P pager=off -c "$*"
