#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/mindful-trade-signal-flow"
MIRROR_DIR="/Users/kenyeung/Documents/Insider Flow/Base44UXUI/mindful-trade-signal-flow"

if [[ ! -d "$MIRROR_DIR" ]]; then
  echo "Mirror directory missing: $MIRROR_DIR"
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory missing: $SOURCE_DIR"
  exit 1
fi

echo "Syncing mirror -> source..."
rsync -av --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .env \
  --exclude .env.local \
  --exclude .env.* \
  --exclude .DS_Store \
  "$MIRROR_DIR/" \
  "$SOURCE_DIR/"

echo ""
bash "$ROOT_DIR/scripts/check_vite_mirror_sync.sh"
