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
COMPOSE_FILES=()
IS_WSL=0
IS_WINDOWS=0
DOCKER_SUDO=0
MODEL_PULL_OK=0

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
     → 修改 .env 入面 OPENWEBUI_PORT=3080，再 docker compose up -d

  3. 模型下載慢 / 失敗 Model download slow or failed
     → 正常約 2GB；手動: docker compose exec ollama ollama pull qwen2.5:3b

  4. Open WebUI 打唔開 / Ollama 連唔到
     → 確認 OLLAMA_BASE_URL=http://if-agent-ollama:11434
     → 日誌: docker compose logs -f open-webui ollama

  5. WSL 用戶
     → Docker Desktop → Settings → Resources → WSL Integration → 開啟你的 distro
     → 或改用 Windows 版 install.bat

  支援 Support: team@insiderflow.asia
EOF
}

print_wsl_guide() {
  cat <<EOF

${CYAN}${BOLD}── WSL 用戶快速檢查清單 WSL checklist ──${NC}

  1. Windows 已安裝 ${BOLD}Docker Desktop${NC}（唔係只裝 WSL 入面嘅 docker.io）
  2. Docker Desktop 已 ${BOLD}啟動${NC}（系統 tray 見到 whale icon）
  3. Docker Desktop → ${BOLD}Settings → Resources → WSL Integration${NC}
     → 開啟你而家用緊嘅 distro（例如 Ubuntu）
  4. 喺 WSL terminal 測試: ${BOLD}docker info${NC}（唔好 sudo）
  5. 如果仍然失敗，可以喺 Windows 下載 package 後雙擊 ${BOLD}install.bat${NC}

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
    print_wsl_guide
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

load_env_ports() {
  cd "$INSTALL_DIR"
  # shellcheck disable=SC1091
  set -a; source .env 2>/dev/null || true; set +a
  OLLAMA_PORT="${OLLAMA_PORT:-11434}"
  OPENWEBUI_PORT="${OPENWEBUI_PORT:-3000}"
  WEBUI_URL="http://localhost:${OPENWEBUI_PORT}"
}

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
    print_wsl_guide
    fail "WSL 內無法連接 Docker。請跟上面清單檢查 Docker Desktop。
Cannot reach Docker from WSL. Follow the checklist above."
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

verify_compose_files() {
  step "檢查部署檔 Checking deployment files..."
  cd "$INSTALL_DIR"

  [[ -f docker-compose.yml ]] || fail "找不到 docker-compose.yml。請重新下載 package。
Missing docker-compose.yml — re-download the package."

  if ! grep -q 'OLLAMA_BASE_URL.*if-agent-ollama' docker-compose.yml 2>/dev/null; then
    warn "docker-compose.yml 可能係舊版本（OLLAMA_BASE_URL 未指向 if-agent-ollama）"
    warn "Old compose file? Open WebUI may fail to reach Ollama — download latest package"
  else
    ok "Open WebUI → Ollama 設定正確 OLLAMA_BASE_URL OK"
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

  [[ -f .env.example ]] || fail "找不到 .env.example"

  if [[ ! -f .env ]]; then
    cp .env.example .env
    ok "已建立 .env Created .env"
  else
    info "沿用現有 .env Using existing .env"
  fi

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
  load_env_ports
}

compose_files() {
  COMPOSE_FILES=(-f docker-compose.yml)
  if [[ "$PROFILE" == "gpu" && -f docker-compose.gpu.yml ]]; then
    COMPOSE_FILES+=(-f docker-compose.gpu.yml)
  fi
}

ollama_container_status() {
  docker_cmd inspect -f '{{.State.Status}}' if-agent-ollama 2>/dev/null || echo "missing"
}

ollama_health_status() {
  docker_cmd inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' if-agent-ollama 2>/dev/null || echo "missing"
}

ollama_api_ready() {
  compose_cmd "${COMPOSE_FILES[@]}" --profile "$PROFILE" exec -T ollama ollama list >/dev/null 2>&1 && return 0
  curl -sf "http://127.0.0.1:${OLLAMA_PORT}/api/tags" >/dev/null 2>&1 && return 0
  return 1
}

wait_for_ollama() {
  local i elapsed=0 max_wait=120
  local status health

  step "等待 Ollama 就緒 Waiting for Ollama (up to ${max_wait}s)..."

  # Phase 1: container running
  info "Phase 1/3: 等待容器啟動 container starting..."
  for i in $(seq 1 60); do
    status="$(ollama_container_status)"
    if [[ "$status" == "running" ]]; then
      ok "Ollama 容器已運行 Container running"
      break
    fi
    if [[ "$status" == "missing" && "$i" -gt 10 ]]; then
      warn "找不到 if-agent-ollama 容器，檢查 compose 狀態..."
      compose_cmd "${COMPOSE_FILES[@]}" --profile "$PROFILE" ps ollama || true
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  if [[ "$(ollama_container_status)" != "running" ]]; then
    warn "Ollama 容器未進入 running 狀態 Container not running"
    return 1
  fi

  # Phase 2: healthcheck (if configured)
  info "Phase 2/3: 等待 health check..."
  for i in $(seq 1 40); do
    health="$(ollama_health_status)"
    case "$health" in
      healthy)
        ok "Ollama health check: healthy"
        break
        ;;
      unhealthy)
        warn "Ollama health check: unhealthy（仍會嘗試連 API）"
        break
        ;;
      starting)
        sleep 3
        ;;
      none)
        ok "Ollama 無 healthcheck，跳過 Phase 2"
        break
        ;;
    esac
    elapsed=$((elapsed + 3))
    [[ "$elapsed" -ge "$max_wait" ]] && break
  done

  # Phase 3: API responds
  info "Phase 3/3: 等待 Ollama API..."
  while [[ "$elapsed" -lt "$max_wait" ]]; do
    if ollama_api_ready; then
      ok "Ollama API 已就緒 Ollama API ready"
      return 0
    fi
    sleep 3
    elapsed=$((elapsed + 3))
    info "  ...已等 ${elapsed}s / ${max_wait}s"
  done

  warn "Ollama 等待超時（${max_wait}s）Ollama wait timed out"
  warn "可查看日誌: docker compose logs ollama"
  return 1
}

verify_model_pulled() {
  local model="$1"
  local list_out

  list_out="$(compose_cmd "${COMPOSE_FILES[@]}" --profile "$PROFILE" exec -T ollama ollama list 2>/dev/null || true)"

  if echo "$list_out" | grep -qF "$model"; then
    ok "模型已確認存在 Model verified: $model"
    MODEL_PULL_OK=1
    return 0
  fi

  # ollama 有時顯示 tag 略有不同，再試 base name
  local base="${model%%:*}"
  if echo "$list_out" | grep -qi "$base"; then
    ok "模型已確認（部分匹配）Model verified (partial): $model"
    MODEL_PULL_OK=1
    return 0
  fi

  warn "模型列表中未找到 $model Model not found in ollama list"
  warn "目前模型列表 Current models:"
  echo "$list_out" | sed 's/^/    /'
  MODEL_PULL_OK=0
  return 1
}

wait_for_open_webui() {
  local elapsed=0 max_wait=120
  local http_code

  step "等待 Open WebUI 就緒 Waiting for Open WebUI (up to ${max_wait}s)..."

  while [[ "$elapsed" -lt "$max_wait" ]]; do
    if command_exists curl; then
      http_code="$(curl -sf -o /dev/null -w '%{http_code}' "$WEBUI_URL" 2>/dev/null || echo "000")"
      if [[ "$http_code" =~ ^(200|301|302|307|308)$ ]]; then
        ok "Open WebUI 可訪問 WebUI reachable (${WEBUI_URL})"
        return 0
      fi
    else
      # fallback: container running
      if [[ "$(docker_cmd inspect -f '{{.State.Status}}' if-agent-open-webui 2>/dev/null)" == "running" && "$elapsed" -ge 15 ]]; then
        warn "未安裝 curl，假設 Open WebUI 已啟動（容器 running）"
        return 0
      fi
    fi
    sleep 3
    elapsed=$((elapsed + 3))
    info "  ...已等 ${elapsed}s（HTTP ${http_code:-n/a}）"
  done

  warn "Open WebUI 等待超時，仍會嘗試開啟瀏覽器 WebUI wait timed out"
  warn "請稍等 30 秒後手動開啟: $WEBUI_URL"
  warn "日誌: docker compose logs -f open-webui"
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
  local model
  step "下載 AI 模型 Downloading model: $DEFAULT_MODEL..."
  cd "$INSTALL_DIR"
  compose_files
  load_env_ports

  model=$(grep '^OLLAMA_DEFAULT_MODEL=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'")
  [[ -z "$model" ]] && model="$DEFAULT_MODEL"

  if ! wait_for_ollama; then
    warn "Ollama 未完全就緒，仍會嘗試 pull 模型..."
  fi

  info "正在 pull $model（約 2GB，請耐心等候）..."
  if compose_cmd "${COMPOSE_FILES[@]}" --profile "$PROFILE" exec -T ollama ollama pull "$model"; then
    verify_model_pulled "$model" || warn "Pull 命令成功但驗證未通過，可稍後重試 pull"
  else
    MODEL_PULL_OK=0
    warn "模型自動拉取失敗（部署會繼續）Model pull failed — setup continues"
    warn "稍後手動執行 Manual retry:"
    echo "  cd $INSTALL_DIR && docker compose --profile $PROFILE exec ollama ollama pull $model"
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
  if [[ "$IS_WSL" -eq 1 ]]; then
    info "WSL 提示: 喺 Windows 瀏覽器開 $url"
  fi
}

print_summary() {
  cd "$INSTALL_DIR"
  load_env_ports

  cat <<EOF

${GREEN}${BOLD}══════════════════════════════════════════════════════════${NC}
${GREEN}${BOLD}  部署完成！Setup complete!${NC}
${GREEN}${BOLD}══════════════════════════════════════════════════════════${NC}

  ${BOLD}Open WebUI（員工聊天）:${NC}  ${WEBUI_URL}
  n8n（工作流）:           http://localhost:${N8N_PORT:-5678}
  Chroma（知識庫）:        http://localhost:${CHROMA_PORT:-8000}

  預設模型 Default model:  ${DEFAULT_MODEL}
  模型狀態 Model status:   $( [[ "$MODEL_PULL_OK" -eq 1 ]] && echo "✓ 已就緒 ready" || echo "⚠ 請手動 pull / pull manually" )
  安裝目錄 Install dir:   ${INSTALL_DIR}

${YELLOW}${BOLD}首次使用 First-time setup:${NC}
  1. 瀏覽器會開啟 Open WebUI
  2. ${BOLD}建立管理員帳號 Create admin account${NC}（第一個註冊嘅帳號）
  3. 揀模型 ${DEFAULT_MODEL}，開始對話

${YELLOW}常用指令 Useful commands:${NC}
  停止 Stop:  cd ${INSTALL_DIR} && docker compose --profile ${PROFILE} down
  日誌 Logs:  cd ${INSTALL_DIR} && docker compose logs -f open-webui

  專人代部署 Professional setup: team@insiderflow.asia
${GREEN}══════════════════════════════════════════════════════════${NC}
EOF
}

main() {
  banner
  parse_args "$@"
  detect_platform
  ensure_docker
  check_compose
  check_gpu
  download_package
  verify_compose_files
  setup_env
  compose_files
  pull_and_start
  pull_default_model
  wait_for_open_webui || true
  print_summary
  open_browser "$WEBUI_URL"
}

main "$@"
