#!/usr/bin/env bash
# Insider Flow AI Agent — 一鍵部署腳本
# Usage: curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash
#        curl -fsSL ... | bash -s -- --profile gpu

set -euo pipefail

PROFILE="cpu"
PACKAGE_URL="https://www.insiderflow.asia/ai-agent/package.tar.gz"
INSTALL_DIR="${INSIDERFLOW_AGENT_DIR:-$HOME/insiderflow-agent}"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

usage() {
  cat <<EOF
Insider Flow AI Agent 一鍵部署

用法:
  bash install.sh [--profile cpu|gpu] [--dir PATH]

選項:
  --profile cpu|gpu   部署模式（預設 cpu）
  --dir PATH          安裝目錄（預設 ~/insiderflow-agent）
  -h, --help          顯示此說明
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="${2:-cpu}"; shift 2 ;;
    --dir)     INSTALL_DIR="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) fail "未知參數: $1（用 --help 查看用法）" ;;
  esac
done

[[ "$PROFILE" == "cpu" || "$PROFILE" == "gpu" ]] || fail "--profile 只接受 cpu 或 gpu"

command_exists() { command -v "$1" >/dev/null 2>&1; }

check_docker() {
  if command_exists docker && docker info >/dev/null 2>&1; then
    ok "Docker 已就緒"
    return 0
  fi
  return 1
}

install_docker_hint() {
  cat <<EOF

${YELLOW}未偵測到 Docker。請先安裝：${NC}

  macOS:   https://docs.docker.com/desktop/install/mac-install/
  Ubuntu:  curl -fsSL https://get.docker.com | sh
  其他:    https://docs.docker.com/engine/install/

安裝後重新執行此腳本。
EOF
  exit 1
}

check_compose() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
    ok "Docker Compose 已就緒"
    return 0
  fi
  if command_exists docker-compose && docker-compose version >/dev/null 2>&1; then
    COMPOSE="docker-compose"
    ok "docker-compose 已就緒"
    return 0
  fi
  fail "找不到 docker compose，請升級 Docker Desktop 或安裝 compose plugin"
}

check_gpu() {
  if [[ "$PROFILE" != "gpu" ]]; then return 0; fi
  if docker run --rm --gpus all nvidia/cuda:12.0.0-base-ubuntu22.04 nvidia-smi >/dev/null 2>&1; then
    ok "NVIDIA GPU 環境正常"
  else
    warn "GPU profile 已選但 nvidia-smi 測試失敗；將嘗試繼續，若 Ollama 無法用 GPU 請改 --profile cpu"
  fi
}

download_package() {
  mkdir -p "$INSTALL_DIR"
  if [[ -f "$INSTALL_DIR/docker-compose.yml" ]]; then
    info "偵測到現有安裝目錄: $INSTALL_DIR"
  else
    info "下載部署 package..."
    TMP=$(mktemp -d)
    trap 'rm -rf "$TMP"' EXIT
    if curl -fsSL "$PACKAGE_URL" -o "$TMP/package.tar.gz" 2>/dev/null; then
      tar -xzf "$TMP/package.tar.gz" -C "$INSTALL_DIR" --strip-components=1 2>/dev/null || \
        tar -xzf "$TMP/package.tar.gz" -C "$INSTALL_DIR"
      ok "Package 已解壓至 $INSTALL_DIR"
    else
      warn "無法下載遠端 package，使用腳本同目錄檔案..."
      SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
      if [[ -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
        cp -n "$SCRIPT_DIR/docker-compose.yml" "$INSTALL_DIR/" 2>/dev/null || true
        cp -n "$SCRIPT_DIR/docker-compose.gpu.yml" "$INSTALL_DIR/" 2>/dev/null || true
        cp -n "$SCRIPT_DIR/.env.example" "$INSTALL_DIR/" 2>/dev/null || true
        [[ -d "$SCRIPT_DIR/api" ]] && cp -R "$SCRIPT_DIR/api" "$INSTALL_DIR/"
        ok "已從本地複製部署檔"
      else
        fail "找不到部署檔案，請從 https://www.insiderflow.asia/ai-agent 下載完整 package"
      fi
    fi
  fi
}

setup_env() {
  cd "$INSTALL_DIR"
  if [[ ! -f .env ]]; then
    cp .env.example .env
    ok "已建立 .env（請稍後修改密碼同 WEBUI_SECRET_KEY）"
  else
    info "沿用現有 .env"
  fi
  # shellcheck disable=SC2016
  if grep -q '^COMPOSE_PROFILES=' .env; then
    sed -i.bak "s/^COMPOSE_PROFILES=.*/COMPOSE_PROFILES=$PROFILE/" .env
    rm -f .env.bak
  else
    echo "COMPOSE_PROFILES=$PROFILE" >> .env
  fi
}

compose_files() {
  COMPOSE_FILES=(-f docker-compose.yml)
  if [[ "$PROFILE" == "gpu" && -f docker-compose.gpu.yml ]]; then
    COMPOSE_FILES+=(-f docker-compose.gpu.yml)
  fi
}

pull_and_start() {
  cd "$INSTALL_DIR"
  export COMPOSE_PROFILES="$PROFILE"
  compose_files
  info "拉取 Docker images（首次可能需要幾分鐘）..."
  $COMPOSE "${COMPOSE_FILES[@]}" --profile "$PROFILE" pull
  info "啟動服務..."
  $COMPOSE "${COMPOSE_FILES[@]}" --profile "$PROFILE" up -d
  ok "所有服務已啟動"
}

pull_default_model() {
  cd "$INSTALL_DIR"
  MODEL=$(grep '^OLLAMA_DEFAULT_MODEL=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' || echo "llama3.2:3b")
  [[ -z "$MODEL" ]] && MODEL="llama3.2:3b"
  info "拉取預設 LLM 模型: $MODEL（可跳過，稍後於 Open WebUI 下載）..."
  compose_files
  if $COMPOSE "${COMPOSE_FILES[@]}" --profile "$PROFILE" exec -T ollama ollama pull "$MODEL" 2>/dev/null; then
    ok "模型 $MODEL 已就緒"
  else
    warn "模型自動拉取失敗，請登入 Open WebUI 手動下載"
  fi
}

print_summary() {
  cd "$INSTALL_DIR"
  # shellcheck disable=SC1091
  set -a; source .env 2>/dev/null || true; set +a
  WEBUI_PORT="${OPENWEBUI_PORT:-3000}"
  N8N_PORT="${N8N_PORT:-5678}"
  CHROMA_PORT="${CHROMA_PORT:-8000}"
  API_PORT="${API_PORT:-8080}"
  HOST="${INSIDERFLOW_HOST:-localhost}"

  cat <<EOF

${GREEN}══════════════════════════════════════════════════════════${NC}
${GREEN}  Insider Flow AI Agent 部署完成！${NC}
${GREEN}══════════════════════════════════════════════════════════${NC}

  Open WebUI（員工聊天介面）:  http://${HOST}:${WEBUI_PORT}
  n8n（工作流 / 審批）:        http://${HOST}:${N8N_PORT}
  Chroma（向量庫）:            http://${HOST}:${CHROMA_PORT}
  API（審計 / 文件）:          http://${HOST}:${API_PORT}

  安裝目錄: ${INSTALL_DIR}
  模式:     ${PROFILE}

${YELLOW}下一步：${NC}
  1. 打開 Open WebUI 建立管理員帳號
  2. 修改 .env 入面嘅密碼同 WEBUI_SECRET_KEY
  3. 參考 README 上傳公司文件建立「內部知識庫問答 Agent」

  停止: cd ${INSTALL_DIR} && $COMPOSE --profile ${PROFILE} down
  日誌: cd ${INSTALL_DIR} && $COMPOSE --profile ${PROFILE} logs -f

  需要專人代部署？聯絡 team@insiderflow.asia
${GREEN}══════════════════════════════════════════════════════════${NC}
EOF
}

main() {
  echo ""
  info "Insider Flow AI Agent 一鍵部署（profile: $PROFILE）"
  echo ""

  check_docker || install_docker_hint
  check_compose
  check_gpu
  download_package
  setup_env
  pull_and_start
  sleep 5
  pull_default_model
  print_summary
}

main "$@"
