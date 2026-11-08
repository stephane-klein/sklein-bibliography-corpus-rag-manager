#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../"

curl -fsS "http://127.0.0.1:${PORT:?PORT is not set}/-/ready"
printf '%s\n' "$PORT" > .pitchfork-webapp-port
