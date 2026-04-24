#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/mindful-trade-signal-flow"
MIRROR_DIR="/Users/kenyeung/Documents/Insider Flow/Base44UXUI/mindful-trade-signal-flow"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Error: source directory not found: $SOURCE_DIR"
  exit 1
fi

if [[ ! -d "$MIRROR_DIR" ]]; then
  echo "Mirror directory missing (skip): $MIRROR_DIR"
  exit 0
fi

echo "Checking mirror sync..."
echo "source: $SOURCE_DIR"
echo "mirror: $MIRROR_DIR"

DIFF_OUTPUT="$(
  diff -rq \
    --exclude node_modules \
    --exclude dist \
    --exclude .env \
    --exclude .env.local \
    --exclude .env.* \
    --exclude .DS_Store \
    "$SOURCE_DIR" "$MIRROR_DIR" || true
)"

if [[ -z "$DIFF_OUTPUT" ]]; then
  echo "OK: mirror is in sync."
  exit 0
fi

echo "Mirror drift detected:"
echo "$DIFF_OUTPUT"
echo ""
echo "Sync command:"
echo "rsync -av --delete --exclude node_modules --exclude dist \\"
echo "  \"$MIRROR_DIR/\" \\"
echo "  \"$SOURCE_DIR/\""
exit 1
