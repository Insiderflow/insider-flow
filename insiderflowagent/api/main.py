"""Insider Flow AI Agent — 輕量 API（審計日誌 + 健康檢查）"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

DATA_DIR = Path(os.environ.get("DATA_DIR", "/app/data"))
AUDIT_FILE = DATA_DIR / "audit.log"
ENABLE_AUDIT = os.environ.get("ENABLE_AUDIT_LOG", "true").lower() == "true"
API_SECRET = os.environ.get("API_SECRET_KEY", "change-me")

app = FastAPI(title="Insider Flow Agent API", version="1.0.0")
DATA_DIR.mkdir(parents=True, exist_ok=True)


class AuditEntry(BaseModel):
    action: str
    user: str | None = None
    resource: str | None = None
    detail: str | None = None


def _verify_key(key: str | None) -> None:
    if API_SECRET != "change-me" and key != API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "insiderflow-agent-api",
        "audit_enabled": ENABLE_AUDIT,
        "time": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/audit")
def append_audit(entry: AuditEntry, x_api_key: str | None = Header(default=None)):
    _verify_key(x_api_key)
    if not ENABLE_AUDIT:
        return {"logged": False, "reason": "audit disabled"}

    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        **entry.model_dump(),
    }
    with AUDIT_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return {"logged": True}


@app.get("/audit/recent")
def recent_audit(limit: int = 50, x_api_key: str | None = Header(default=None)):
    _verify_key(x_api_key)
    if not AUDIT_FILE.exists():
        return {"entries": []}
    lines = AUDIT_FILE.read_text(encoding="utf-8").strip().splitlines()
    entries = [json.loads(line) for line in lines[-limit:]]
    return {"entries": entries}
