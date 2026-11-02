#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

helm uninstall sklein-bibliography-corpus-rag-manager --namespace sklein-bibliography-corpus-rag-manager-test 2>/dev/null || true
kubectl delete namespace sklein-bibliography-corpus-rag-manager-test 2>/dev/null || true
