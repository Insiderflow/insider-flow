#!/usr/bin/env bash
# Build public/ai-agent/package.tar.gz from insiderflowagent source
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/insiderflowagent"
DEST="$ROOT/web/public/ai-agent"

mkdir -p "$DEST"

for f in install.sh install.bat docker-compose.yml docker-compose.gpu.yml .env.example README.md; do
  cp "$SRC/$f" "$DEST/"
done
chmod +x "$DEST/install.sh"
cp -R "$SRC/api" "$DEST/"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp "$DEST/install.sh" "$DEST/install.bat" "$DEST/docker-compose.yml" "$DEST/docker-compose.gpu.yml" "$DEST/.env.example" "$DEST/README.md" "$TMP/"
cp -R "$DEST/api" "$TMP/"

tar -czf "$DEST/package.tar.gz" -C "$TMP" .
echo "Built $DEST/package.tar.gz"
