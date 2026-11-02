#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

kubectl get namespace sklein-bibliography-corpus-rag-manager-test 2>/dev/null || kubectl create namespace sklein-bibliography-corpus-rag-manager-test

helm upgrade --install sklein-bibliography-corpus-rag-manager oci://ghcr.io/stephane-klein/charts/sklein-bibliography-corpus-rag-manager \
    --namespace sklein-bibliography-corpus-rag-manager-test \
    --set ingress.enabled=true \
    --set ingress.host=sklein-bibliography-corpus-rag-manager-test.sklein.internal \
    --set-json 'ingress.annotations={"cert-manager.io/cluster-issuer":"homelab-ca"}' \
    --set-json 'ingress.tls=[{"hosts":["sklein-bibliography-corpus-rag-manager-test.sklein.internal"],"secretName":"sklein-bibliography-corpus-rag-manager-test-tls"}]' \
    --set seed.enabled=true \
    --set cnpg.namespace=sklein-bibliography-corpus-rag-manager-test

echo "Waiting for rollout to complete..."
kubectl rollout status deployment/sklein-bibliography-corpus-rag-manager --namespace sklein-bibliography-corpus-rag-manager-test --timeout=300s

echo ""
echo "Application is ready at:"
echo "  https://sklein-bibliography-corpus-rag-manager-test.sklein.internal"
