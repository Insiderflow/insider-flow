# Insider Flow AI Agent — 私有化部署包

> 俾香港中小企喺自己 server 跑 Private AI Agent，數據唔出公司。

## 快速開始

### 方法一：一鍵腳本（推薦）

```bash
curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash
```

GPU 模式：

```bash
curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash -s -- --profile gpu
```

### 方法二：手動部署

1. 下載完整 package（`package.tar.gz`）並解壓
2. 複製環境設定：`cp .env.example .env`
3. 修改 `.env` 入面嘅密碼同 `WEBUI_SECRET_KEY`
4. 啟動：

```bash
# CPU（入門）
COMPOSE_PROFILES=cpu docker compose up -d

# GPU（需 NVIDIA + nvidia-container-toolkit）
COMPOSE_PROFILES=gpu docker compose up -d
```

5. 打開 **http://localhost:3000**（Open WebUI）建立管理員帳號

## 包含咩？

| 服務 | 用途 | 預設端口 |
|------|------|----------|
| **Ollama** | 本地 LLM 推理 | 11434 |
| **Open WebUI** | 員工聊天介面 | 3000 |
| **n8n** | 工作流、Human-in-the-loop 審批 | 5678 |
| **Chroma** | 向量資料庫（知識庫 RAG） | 8000 |
| **FastAPI** | 審計日誌 API | 8080 |

## 第一個 Template：公司內部知識庫問答 Agent

1. 將 HR 手冊、SOP、FAQ PDF 放入 Open WebUI「Documents」
2. 建立 Knowledge Base 並連接 Chroma
3. 用 n8n 設定：敏感問題要主管 Approve 先出答案
4. 所有查詢經 API `/audit` 記錄，方便 PDPO 合規查核

## 系統要求

- **CPU 模式**：4 vCPU、16 GB RAM、50 GB 硬碟（試用 / 10 人以下）
- **GPU 模式**：NVIDIA GPU 8 GB+ VRAM（建議 20 人以上）
- Docker 24+ 同 Docker Compose v2
- Linux（Ubuntu 22.04+）或 macOS（Docker Desktop）

## 常見操作

```bash
# 睇 log
docker compose logs -f open-webui

# 停止
docker compose down

# 更新 images
docker compose pull && docker compose up -d

# 備份資料
tar -czf backup-$(date +%Y%m%d).tar.gz data/ $(docker volume ls -q | grep if-agent)
```

## 安全建議

- 改晒 `.env` 預設密碼
- 只喺公司內網 / VPN 開放端口
- 定期備份 `openwebui_data`、`chroma_data`、`n8n_data` volumes
- 敏感行業考慮加 reverse proxy + TLS（nginx / Caddy）

## 專人代部署

唔想自己搞？我哋提供上門 / 遠程部署、PDPO 合規顧問、客製 Agent template：

📧 **team@insiderflow.asia**

---

© Insider Flow · [insiderflow.asia/ai-agent](https://www.insiderflow.asia/ai-agent)
