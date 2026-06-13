# 私域 AI — 公司內部私有 AI 助手

> Free Plan：Chat + RAG 知識庫，一鍵部署，數據唔出公司。

## Free Plan（自助 · 免費）

```bash
# Linux / macOS / WSL
curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash

# Windows：Docker Desktop + 雙擊 install.bat
```

包含：**Ollama + Open WebUI + Chroma**（Chat + RAG）  
唔包含：n8n workflow（Professional Plan 先有）

## Professional Plan（AI Agent）

Human-in-the-loop、客製 workflow、系統整合 — 填問卷 + 開會，專人設計。  
聯絡：team@insiderflow.asia

## 預設模型

**qwen2.5:3b**（中文友好 · 約 2GB）

## 硬件建議

| 規模 | 配置 |
|------|------|
| ≤10 人 | 4核 / 16GB / 512GB SSD 迷你主機 |
| 10–30 人 | 8核 / 32GB / 1TB SSD |
| 30+ 人 | + GPU 8GB+ VRAM |

## 常用指令

```bash
docker compose logs -f open-webui
docker compose down
docker compose pull && docker compose up -d --build
```

Professional 加購（需專人協助）：
```bash
docker compose --profile cpu --profile pro up -d
```
