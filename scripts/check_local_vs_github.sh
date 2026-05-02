#!/usr/bin/env bash
#
# Compare local Git state vs GitHub (remote tracking branch).
# Helps spot: unpushed work, dirty tree, untracked local clutter vs what's on origin.
#
# Usage:
#   bash scripts/check_local_vs_github.sh
#   bash scripts/check_local_vs_github.sh origin        # explicit remote name
#   bash scripts/check_local_vs_github.sh --no-fetch    # offline / skip network
#
# From repo root:
#   npm run check:github
#
set -euo pipefail

REMOTE="${REMOTE:-origin}"
NO_FETCH=false
for arg in "$@"; do
  case "$arg" in
    --no-fetch) NO_FETCH=true ;;
    -*)
      echo "Unknown flag: $arg"
      exit 2
      ;;
    *)
      REMOTE="$arg"
      ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Error: not inside a Git repository."
  exit 1
}
cd "$ROOT"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
UPSTREAM=""
if git rev-parse --abbrev-ref '@{upstream}' >/dev/null 2>&1; then
  UPSTREAM="$(git rev-parse --abbrev-ref '@{upstream}')"
elif git show-ref --verify --quiet "refs/remotes/${REMOTE}/${BRANCH}"; then
  UPSTREAM="${REMOTE}/${BRANCH}"
elif git show-ref --verify --quiet "refs/remotes/${REMOTE}/main"; then
  UPSTREAM="${REMOTE}/main"
  echo "Note: no upstream set for '${BRANCH}'; comparing to ${UPSTREAM} instead."
  echo "Fix: git branch -u ${REMOTE}/${BRANCH}"
else
  echo "Error: cannot resolve ${REMOTE}/${BRANCH} or ${REMOTE}/main. Run: git fetch ${REMOTE}"
  exit 1
fi

echo "══════════════════════════════════════════════════════════════"
echo " Repo root : $ROOT"
echo " Branch    : $BRANCH"
echo " Remote ref: $UPSTREAM"
echo "══════════════════════════════════════════════════════════════"
echo ""

if [[ "$NO_FETCH" == false ]] && [[ "${INSIDER_FLOW_SKIP_FETCH:-}" != "1" ]]; then
  echo ">>> Fetching ${REMOTE} …"
  git fetch "$REMOTE" --prune --quiet || {
    echo "WARN: git fetch failed (offline?). Re-run with --no-fetch or set INSIDER_FLOW_SKIP_FETCH=1"
    exit 1
  }
  echo ""
fi

AHEAD="$(git rev-list --count "${UPSTREAM}"..HEAD 2>/dev/null || echo 0)"
BEHIND="$(git rev-list --count HEAD.."${UPSTREAM}" 2>/dev/null || echo 0)"

echo ">>> Commits vs GitHub (${UPSTREAM})"
echo "    Ahead (you have local commits NOT on GitHub yet): $AHEAD"
echo "    Behind (GitHub has commits you did NOT pull yet): $BEHIND"
echo ""

if [[ "$AHEAD" != "0" ]]; then
  echo ">>> Unpushed commits (newest first, max 15):"
  git log --oneline "${UPSTREAM}"..HEAD | head -15 || true
  echo ""
  echo ">>> Files touched by unpushed commits (name-only):"
  git diff --name-only "${UPSTREAM}"..HEAD | sort -u
  echo ""
fi

DIRTY="$(git status --porcelain)"
if [[ -n "$DIRTY" ]]; then
  echo ">>> Working tree — modified / staged / untracked (short)"
  git status --short
  echo ""
else
  echo ">>> Working tree: clean (no unstaged/uncommitted changes)."
  echo ""
fi

echo ">>> Untracked paths (exist locally, NOT in Git — backup won't include these)"
UNTRACKED_COUNT=0
UNTRACKED_TMP="$(mktemp)"
trap 'rm -f "$UNTRACKED_TMP" "${TMP:-}"' EXIT
git ls-files --others --exclude-standard >"$UNTRACKED_TMP" || true
UNTRACKED_COUNT="$(wc -l <"$UNTRACKED_TMP" | tr -d ' ')"
if [[ "$UNTRACKED_COUNT" == "0" ]]; then
  echo "    (none)"
else
  sed 's/^/    /' "$UNTRACKED_TMP"
  echo ""
  echo "    Count: ${UNTRACKED_COUNT} paths above."
fi
echo ""

echo ">>> Largest untracked files (excluding node_modules / dist / .next / build — max 15)"
TMP="$(mktemp)"
while IFS= read -r f; do
  [[ -z "$f" || ! -f "$f" ]] && continue
  case "$f" in
    */node_modules/* | */dist/* | */dist-ssr/* | */.next/* | */android/build/* | */android/app/build/* | */ios/App/build/*)
      continue
      ;;
  esac
  sz="$(wc -c <"$f" 2>/dev/null | tr -d ' ')"
  echo "${sz}	$f"
done <"$UNTRACKED_TMP" >"$TMP" || true
if [[ -s "$TMP" ]]; then
  sort -nr "$TMP" | head -15 | awk -F'\t' '{printf "    %10s bytes  %s\n", $1, $2}'
else
  echo "    (none or skipped)"
fi
echo ""

echo ">>> Ignored paths present on disk (git sees them as !! — often caches / deps)"
IGNORED="$(git status --ignored --short | grep '^!!' || true)"
if [[ -z "$IGNORED" ]]; then
  echo "    (none reported)"
else
  COUNT="$(echo "$IGNORED" | wc -l | tr -d ' ')"
  echo "$IGNORED" | head -40
  if [[ "$COUNT" -gt 40 ]]; then
    echo "    … plus $((COUNT - 40)) more lines (truncated)."
  fi
fi
echo ""

echo "══════════════════════════════════════════════════════════════"
echo " How to read this"
echo "• 'Ahead' + file list = what would appear on GitHub after git push."
echo "• Untracked = never backed up by Git until you git add + commit."
echo "• Ignored (!!) = intentional excludes (node_modules, etc.) — usually OK."
echo "• This script does NOT prove 'dead code' inside tracked files."
echo "══════════════════════════════════════════════════════════════"
