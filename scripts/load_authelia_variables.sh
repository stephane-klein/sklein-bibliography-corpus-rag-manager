AUTHELIA_CONTAINER_ID=$(podman ps --filter "label=com.docker.compose.service=authelia" --format '{{.ID}}')

if [ -n "$AUTHELIA_CONTAINER_ID" ]; then
  export AUTHELIA_ISSUER=https://127.0.0.1:9091
  export AUTHELIA_CLIENT_ID=sklein-bibliography-corpus-rag-manager
  export AUTHELIA_CLIENT_SECRET=client-secret-password
else
  unset AUTHELIA_ISSUER AUTHELIA_CLIENT_ID AUTHELIA_CLIENT_SECRET
fi
