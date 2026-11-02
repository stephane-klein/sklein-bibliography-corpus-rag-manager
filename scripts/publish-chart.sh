#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

helm package helm/sklein-bibliography-corpus-rag-manager -d "$WORKDIR"

CHART=$(ls "$WORKDIR"/*.tgz)
if [ -z "$CHART" ]; then
    echo "Error: no chart tarball found in $WORKDIR" >&2
    exit 1
fi

helm push "$CHART" oci://ghcr.io/stephane-klein/charts
