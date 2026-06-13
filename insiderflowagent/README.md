# 私域 AI Agent — 私有化部署包

> 俾香港中小企喺自己 server 跑 Private AI Agent，數據唔出公司。

## 快速開始

### Linux / macOS / WSL（推薦）

```bash
curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash
```

腳本會自動：
- 檢查 / 安裝 Docker（Ubuntu / Debian / WSL）
- 啟動所有服務
- 下載預設模型 **qwen2.5:3b**
- 自動開啟瀏覽器 → http://localhost:3000

GPU 模式：

```bash
curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash -s -- --profile gpu
```

### Windows 用戶

1. 安裝 [Docker Desktop](https://www.docker.com/products/docker-desktop/)（**必須啟用 WSL2**）
2. 下載 package 解壓，**雙擊 `install.bat`**

或在 cmd 執行：

```cmd
install.bat
```

### 手動部署

1. 下載 `package.tar.gz` 並解壓
2. `cp .env.example .env` 並修改密碼
3. `COMPOSE_PROFILES=cpu docker compose up -d --build`
4. `docker compose exec ollama ollama pull qwen2.5:3b`
5. 打開 http://localhost:3000 建立管理員帳號

## 包含咩？

| 服務 | 用途 | 預設端口 |
|------|------|----------|
| **Ollama** | 本地 LLM 推理 | 11434 |
| **Open WebUI** | 員工聊天介面 | 3000 |
| **n8n** | 工作流、Human-in-the-loop 審批 | 5678 |
| **Chroma** | 向量資料庫（知識庫 RAG） | 8000 |
| **FastAPI** | 審計日誌 API | 8080 |

## 預設模型

**qwen2.5:3b** — 中文友好、CPU 可跑、約 2GB

## 系統要求

- **CPU 模式**：4 vCPU、16 GB RAM、50 GB 硬碟
- **GPU 模式**：NVIDIA GPU 8 GB+ VRAM
- Docker 24+ 及 Docker Compose v2
- Windows：Docker Desktop + WSL2

## 常見操作

```bash
docker compose logs -f open-webui    # 睇 log
docker compose down                  # 停止
docker compose pull && docker compose up -d --build  # 更新
```

## 專人代部署

📧 **team@insiderflow.asia**

---

© [insiderflow.asia/ai-agent](https://www.insiderflow.asia/ai-agent)
