#!/usr/bin/env bash
# 私域 AI Agent — 一鍵部署腳本（Linux / macOS / WSL）
#
# 用法:
#   curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash
#   curl -fsSL ... | bash -s -- --profile gpu
#   bash install.sh --dir ~/insiderflow-agent
#
# Windows 原生用戶請用 install.bat（需 Docker Desktop + WSL2）

set -euo pipefail

PROFILE="cpu"
DEFAULT_MODEL="qwen2.5:3b"
PACKAGE_URL="https://www.insiderflow.asia/ai-agent/package.tar.gz"
INSTALL_DIR="${INSIDERFLOW_AGENT_DIR:-$HOME/insiderflow-agent}"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

COMPOSE=""
IS_WSL=0
IS_WINDOWS=0
DOCKER_SUDO=0

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
fail()  { echo -e "${RED}[ERROR]${NC} $*" >&2; print_troubleshooting; exit 1; }
step()  { echo -e "\n${CYAN}${BOLD}▶ $*${NC}"; }

banner() {
  echo -e "${GREEN}${BOLD}"
  cat <<'EOF'
  ╔══════════════════════════════════════════════╗
  ║     私域 AI Agent — 一鍵部署                  ║
  ║     Private On-Prem · 數據唔出公司            ║
  ╚══════════════════════════════════════════════╝
EOF
  echo -e "${NC}"
}

usage() {
  cat <<EOF
用法 Usage:
  bash install.sh [--profile cpu|gpu] [--dir PATH]

選項 Options:
  --profile cpu|gpu   部署模式（預設 cpu / default cpu）
  --dir PATH          安裝目錄（預設 ~/insiderflow-agent）
  -h, --help          顯示說明
EOF
}

print_troubleshooting() {
  cat <<EOF

${YELLOW}── 常見問題 Troubleshooting ──${NC}

  1. Docker 權限不足 Permission denied
     → 執行: sudo usermod -aG docker \$USER && newgrp docker
     → 或暫時用: sudo bash install.sh

  2. 端口 3000 已被佔用 Port in use
     → 修改 .env 入面 OPENWEBUI_PORT=3080

  3. 模型下載慢 Model download slow
     → 正常，首次 qwen2.5:3b 約 2GB，請等完成

  4. Open WebUI 打唔開
     → 等 30 秒再試: docker compose logs -f open-webui

  5. Windows 用戶
     → 請用 Docker Desktop + WSL2，或直接雙擊 install.bat

  支援 Support: team@insiderflow.asia
EOF
}

detect_platform() {
  local uname_s
  uname_s="$(uname -s 2>/dev/null || echo unknown)"

  if [[ "$uname_s" == MINGW* || "$uname_s" == MSYS* || -n "${WINDIR:-}" ]]; then
    IS_WINDOWS=1
  fi

  if grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then
    IS_WSL=1
  fi

  if [[ "$IS_WINDOWS" -eq 1 && "$IS_WSL" -eq 0 ]]; then
    cat <<EOF

${YELLOW}${BOLD}偵測到 Windows 環境 Detected Windows${NC}

此 bash 腳本適用於 WSL2 / Git Bash。
For native Windows, please use:

  1. 安裝 Install ${BOLD}Docker Desktop${NC}（啟用 WSL2 backend）
     https://www.docker.com/products/docker-desktop/

  2. 雙擊或執行 Double-click:
     ${BOLD}install.bat${NC}

EOF
    exit 1
  fi

  if [[ "$IS_WSL" -eq 1 ]]; then
    info "偵測到 WSL2 環境 Detected WSL2"
    info "請確保 Docker Desktop 已啟動且 WSL integration 已開啟"
    info "Ensure Docker Desktop is running with WSL integration enabled"
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --profile) PROFILE="${2:-cpu}"; shift 2 ;;
      --dir)     INSTALL_DIR="${2:-}"; shift 2 ;;
      -h|--help) usage; exit 0 ;;
      *) fail "未知參數 Unknown arg: $1（用 --help 查看）" ;;
    esac
  done
  [[ "$PROFILE" == "cpu" || "$PROFILE" == "gpu" ]] || fail "--profile 只接受 cpu 或 gpu"
}

command_exists() { command -v "$1" >/dev/null 2>&1; }

docker_cmd() {
  if [[ "$DOCKER_SUDO" -eq 1 ]]; then
    sudo docker "$@"
  else
    docker "$@"
  fi
}

compose_cmd() {
  if [[ "$DOCKER_SUDO" -eq 1 ]]; then
    sudo $COMPOSE "$@"
  else
    $COMPOSE "$@"
  fi
}

check_docker() {
  if command_exists docker && docker info >/dev/null 2>&1; then
    ok "Docker 已就緒 Docker is ready"
    return 0
  fi
  if command_exists docker && sudo docker info >/dev/null 2>&1; then
    DOCKER_SUDO=1
    ok "Docker 已就緒（使用 sudo）Docker ready (via sudo)"
    return 0
  fi
  return 1
}

install_docker_linux() {
  step "安裝 Docker Installing Docker..."

  if [[ ! -f /etc/os-release ]]; then
    fail "無法自動安裝 Docker，請手動安裝: https://docs.docker.com/get-docker/"
  fi

  # shellcheck disable=SC1091
  source /etc/os-release
  case "${ID:-}" in
    ubuntu|debian|linuxmint|pop)
      ok "偵測到 ${PRETTY_NAME:-Debian/Ubuntu}，使用官方安裝腳本..."
      if command_exists curl; then
        curl -fsSL https://get.docker.com | sh
      else
        fail "需要 curl，請先: sudo apt-get update && sudo apt-get install -y curl"
      fi
      ;;
    *)
      fail "自動安裝只支援 Ubuntu/Debian/WSL。你的系統: ${PRETTY_NAME:-unknown}
請手動安裝 Docker: https://docs.docker.com/get-docker/"
      ;;
  esac

  if command_exists systemctl; then
    sudo systemctl enable docker 2>/dev/null || true
    sudo systemctl start docker 2>/dev/null || true
  fi

  if groups "$USER" 2>/dev/null | grep -qv docker; then
    sudo usermod -aG docker "$USER" 2>/dev/null || true
    warn "已將你加入 docker group。如仍遇到權限問題，請執行: newgrp docker"
    warn "Added you to docker group. If permission errors persist, run: newgrp docker"
  fi

  if docker info >/dev/null 2>&1; then
    ok "Docker 安裝完成 Docker installed"
  elif sudo docker info >/dev/null 2>&1; then
    DOCKER_SUDO=1
    ok "Docker 安裝完成（需 sudo）Docker installed (sudo required)"
  else
    fail "Docker 安裝後仍無法連接。請重新登入後再試一次。
Docker installed but not reachable. Log out/in and retry."
  fi
}

ensure_docker() {
  step "檢查 Docker Checking Docker..."
  if check_docker; then return 0; fi

  warn "未偵測到 Docker Docker not found"
  if [[ "$IS_WSL" -eq 1 ]]; then
    cat <<EOF

${YELLOW}WSL 用戶請先：${NC}
  1. 安裝 Docker Desktop for Windows
  2. 開啟 Settings → Resources → WSL Integration → 啟用你的 distro
  3. 重新執行此腳本

${YELLOW}WSL users:${NC}
  1. Install Docker Desktop
  2. Enable WSL Integration for your distro
  3. Re-run this script

EOF
    exit 1
  fi

  if [[ -f /etc/os-release ]]; then
    install_docker_linux
  else
    cat <<EOF
${YELLOW}macOS 用戶請安裝 Docker Desktop:${NC}
  https://docs.docker.com/desktop/install/mac-install/
然後重新執行此腳本。
EOF
    exit 1
  fi
}

check_compose() {
  if docker_cmd compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
    ok "Docker Compose 已就緒 Compose ready"
    return 0
  fi
  if command_exists docker-compose && docker-compose version >/dev/null 2>&1; then
    COMPOSE="docker-compose"
    ok "docker-compose 已就緒"
    return 0
  fi
  fail "找不到 docker compose。請升級 Docker Desktop。
Compose not found. Please upgrade Docker Desktop."
}

check_gpu() {
  [[ "$PROFILE" == "gpu" ]] || return 0
  step "檢查 GPU Checking GPU..."
  if docker_cmd run --rm --gpus all nvidia/cuda:12.0.0-base-ubuntu22.04 nvidia-smi >/dev/null 2>&1; then
    ok "NVIDIA GPU 環境正常 GPU OK"
  else
    warn "GPU 測試失敗，將繼續但 Ollama 可能只用 CPU
GPU test failed; Ollama may fall back to CPU"
  fi
}

download_package() {
  step "準備部署檔 Preparing deployment files..."
  mkdir -p "$INSTALL_DIR"

  if [[ -f "$INSTALL_DIR/docker-compose.yml" ]]; then
    ok "使用現有目錄 Using existing: $INSTALL_DIR"
    return 0
  fi

  info "下載 package Downloading package..."
  TMP=$(mktemp -d)
  trap 'rm -rf "$TMP"' EXIT

  if curl -fsSL "$PACKAGE_URL" -o "$TMP/package.tar.gz" 2>/dev/null; then
    tar -xzf "$TMP/package.tar.gz" -C "$INSTALL_DIR" --strip-components=1 2>/dev/null || \
      tar -xzf "$TMP/package.tar.gz" -C "$INSTALL_DIR"
    ok "Package 已解壓至 Extracted to: $INSTALL_DIR"
  else
    warn "無法下載遠端 package，嘗試本地檔案..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [[ -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
      cp "$SCRIPT_DIR/docker-compose.yml" "$INSTALL_DIR/"
      cp "$SCRIPT_DIR/docker-compose.gpu.yml" "$INSTALL_DIR/" 2>/dev/null || true
      cp "$SCRIPT_DIR/.env.example" "$INSTALL_DIR/"
      cp "$SCRIPT_DIR/install.bat" "$INSTALL_DIR/" 2>/dev/null || true
      [[ -d "$SCRIPT_DIR/api" ]] && cp -R "$SCRIPT_DIR/api" "$INSTALL_DIR/"
      ok "已從腳本目錄複製 Copied from script directory"
    else
      fail "找不到部署檔案。請從 https://www.insiderflow.asia/ai-agent 下載 package"
    fi
  fi
}

setup_env() {
  step "設定環境 Configuring environment..."
  cd "$INSTALL_DIR"

  if [[ ! -f .env ]]; then
    cp .env.example .env
    ok "已建立 .env Created .env"
  else
    info "沿用現有 .env Using existing .env"
  fi

  # 確保預設模型一致 Ensure default model
  for key_val in "COMPOSE_PROFILES=$PROFILE" "OLLAMA_DEFAULT_MODEL=$DEFAULT_MODEL" "DEFAULT_MODELS=$DEFAULT_MODEL"; do
    key="${key_val%%=*}"
    val="${key_val#*=}"
    if grep -q "^${key}=" .env; then
      sed -i.bak "s|^${key}=.*|${key}=${val}|" .env
    else
      echo "${key}=${val}" >> .env
    fi
  done
  rm -f .env.bak
}

compose_files() {
  COMPOSE_FILES=(-f docker-compose.yml)
  if [[ "$PROFILE" == "gpu" && -f docker-compose.gpu.yml ]]; then
    COMPOSE_FILES+=(-f docker-compose.gpu.yml)
  fi
}

wait_for_ollama() {
  local i
  info "等待 Ollama 就緒 Waiting for Ollama..."
  for i in $(seq 1 30); do
    if compose_cmd "${COMPOSE_FILES[@]}" --profile "$PROFILE" exec -T ollama ollama list >/dev/null 2>&1; then
      ok "Ollama 已就緒 Ollama is ready"
      return 0
    fi
    sleep 2
  done
  warn "Ollama 等待超時，模型拉取可能失敗 Ollama wait timed out"
  return 1
}

pull_and_start() {
  step "啟動服務 Starting services..."
  cd "$INSTALL_DIR"
  export COMPOSE_PROFILES="$PROFILE"
  compose_files

  info "拉取 images Pulling images（首次約 5–15 分鐘）..."
  compose_cmd "${COMPOSE_FILES[@]}" --profile "$PROFILE" pull

  info "建立並啟動容器 Building & starting containers..."
  compose_cmd "${COMPOSE_FILES[@]}" --profile "$PROFILE" up -d --build

  ok "所有服務已啟動 All services started"
}

pull_default_model() {
  step "下載 AI 模型 Downloading model: $DEFAULT_MODEL..."
  cd "$INSTALL_DIR"
  compose_files

  MODEL=$(grep '^OLLAMA_DEFAULT_MODEL=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'")
  [[ -z "$MODEL" ]] && MODEL="$DEFAULT_MODEL"

  wait_for_ollama || true

  info "正在 pull $MODEL（約 2GB，請耐心等候）..."
  if compose_cmd "${COMPOSE_FILES[@]}" --profile "$PROFILE" exec -T ollama ollama pull "$MODEL"; then
    ok "模型 $MODEL 已就緒 Model ready"
  else
    warn "模型自動拉取失敗，可稍後手動執行:
  cd $INSTALL_DIR && docker compose --profile $PROFILE exec ollama ollama pull $MODEL"
  fi
}

open_browser() {
  local url="$1"
  step "開啟瀏覽器 Opening browser..."

  if command_exists xdg-open; then
    xdg-open "$url" >/dev/null 2>&1 && return 0
  fi
  if command_exists open; then
    open "$url" >/dev/null 2>&1 && return 0
  fi
  if command_exists wslview; then
    wslview "$url" >/dev/null 2>&1 && return 0
  fi
  if [[ "$IS_WSL" -eq 1 ]] && command_exists cmd.exe; then
    cmd.exe /c start "" "$url" >/dev/null 2>&1 && return 0
  fi

  warn "無法自動開啟瀏覽器，請手動前往 Cannot auto-open browser:"
  echo "  $url"
}

print_summary() {
  cd "$INSTALL_DIR"
  # shellcheck disable=SC1091
  set -a; source .env 2>/dev/null || true; set +a
  WEBUI_PORT="${OPENWEBUI_PORT:-3000}"
  WEBUI_URL="http://localhost:${WEBUI_PORT}"

  cat <<EOF

${GREEN}${BOLD}══════════════════════════════════════════════════════════${NC}
${GREEN}${BOLD}  部署完成！Setup complete!${NC}
${GREEN}${BOLD}══════════════════════════════════════════════════════════${NC}

  ${BOLD}Open WebUI（員工聊天）:${NC}  ${WEBUI_URL}
  n8n（工作流）:           http://localhost:${N8N_PORT:-5678}
  Chroma（知識庫）:        http://localhost:${CHROMA_PORT:-8000}

  預設模型 Default model:  ${DEFAULT_MODEL}
  安裝目錄 Install dir:   ${INSTALL_DIR}

${YELLOW}${BOLD}首次使用 First-time setup:${NC}
  1. 瀏覽器會開啟 Open WebUI Browser opens Open WebUI
  2. ${BOLD}建立管理員帳號 Create admin account${NC}（公司用嘅第一個帳號）
  3. 開始同 AI 對話 Start chatting!

${YELLOW}常用指令 Useful commands:${NC}
  停止 Stop:  cd ${INSTALL_DIR} && docker compose --profile ${PROFILE} down
  日誌 Logs:  cd ${INSTALL_DIR} && docker compose logs -f open-webui

  專人代部署 Professional setup: team@insiderflow.asia
${GREEN}══════════════════════════════════════════════════════════${NC}
EOF

  open_browser "$WEBUI_URL"
}

main() {
  banner
  parse_args "$@"
  detect_platform
  ensure_docker
  check_compose
  check_gpu
  download_package
  setup_env
  pull_and_start
  pull_default_model
  print_summary
}

main "$@"
