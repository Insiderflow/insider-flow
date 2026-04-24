#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.git/hooks"
HOOK_FILE="$HOOKS_DIR/pre-commit"

if [[ ! -d "$HOOKS_DIR" ]]; then
  echo "No .git/hooks directory found. Run from inside the git repo."
  exit 1
fi

cat > "$HOOK_FILE" <<'EOF'
#!/usr/bin/env bash
set -u

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CHECK_SCRIPT="$REPO_ROOT/scripts/check_vite_mirror_sync.sh"

if [[ -x "$CHECK_SCRIPT" ]]; then
  if ! bash "$CHECK_SCRIPT" >/dev/null 2>&1; then
    echo "WARNING: mirror drift detected (run: npm run check:mirror or npm run sync:mirror)"
  fi
fi

exit 0
EOF

chmod +x "$HOOK_FILE"
echo "Installed non-blocking pre-commit hook at: $HOOK_FILE"
