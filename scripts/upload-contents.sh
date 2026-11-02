#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

if [ -z "$(find contents -type f -print -quit)" ]; then
    echo "Error: contents/ contains no file, refusing to mirror an empty tree into the bucket." >&2
    exit 1
fi

rc alias set rustfs http://127.0.0.1:9000 "$RUSTFS_ACCESS_KEY" "$RUSTFS_SECRET_KEY"
rc ping rustfs
rc bucket create --ignore-existing rustfs/contents
rc mirror contents/ rustfs/contents/ --overwrite --remove
