@echo off
REM ============================================================
REM  私域 AI Agent — Windows 一鍵部署
REM  需要 Docker Desktop + WSL2 backend
REM
REM  用法: 雙擊此檔案，或在 cmd 執行 install.bat
REM ============================================================

setlocal EnableDelayedExpansion

set "DEFAULT_MODEL=qwen2.5:3b"
set "WEBUI_PORT=3000"
set "WEBUI_URL=http://localhost:%WEBUI_PORT%"
set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

echo.
echo  ========================================================
echo    私域 AI Agent - Windows 一鍵部署
echo    Private On-Prem AI Agent Setup
echo  ========================================================
echo.

cd /d "%INSTALL_DIR%"

REM --- 1. 檢查 Docker ---
echo [1/6] 檢查 Docker Desktop...

where docker >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [!] 未偵測到 Docker。
    echo  [!] Docker not found.
    echo.
    echo  請先安裝 Docker Desktop（建議啟用 WSL2）:
    echo  Please install Docker Desktop with WSL2 backend:
    echo.
    echo    https://www.docker.com/products/docker-desktop/
    echo.
    echo  安裝完成後重新雙擊 install.bat
    echo  After install, double-click install.bat again.
    echo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo  [!] Docker 未運行，嘗試啟動 Docker Desktop...
    echo  [!] Docker not running, starting Docker Desktop...

    if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%LocalAppData%\Docker\Docker Desktop.exe" (
        start "" "%LocalAppData%\Docker\Docker Desktop.exe"
    ) else (
        echo  [!] 找不到 Docker Desktop，請手動啟動後再試。
        pause
        exit /b 1
    )

    echo  等待 Docker 啟動 Waiting for Docker（最多 90 秒）...
    set /a WAIT=0
    :wait_docker
    timeout /t 5 /nobreak >nul
    set /a WAIT+=5
    docker info >nul 2>&1
    if not errorlevel 1 goto docker_ready
    if !WAIT! geq 90 (
        echo  [!] Docker 啟動超時。請確認 Docker Desktop 已完全啟動。
        pause
        exit /b 1
    )
    goto wait_docker
    :docker_ready
)

echo  [OK] Docker 已就緒 Docker is ready.
echo.

REM --- 2. 檢查 docker compose ---
echo [2/6] 檢查 Docker Compose...

docker compose version >nul 2>&1
if errorlevel 1 (
    echo  [!] 找不到 docker compose，請更新 Docker Desktop。
    pause
    exit /b 1
)
echo  [OK] Docker Compose 已就緒.
echo.

REM --- 3. 設定 .env ---
echo [3/6] 設定環境 Setting up .env...

if not exist ".env" (
    if exist ".env.example" (
        copy /Y ".env.example" ".env" >nul
        echo  [OK] 已建立 .env
    ) else (
        echo  [!] 找不到 .env.example
        pause
        exit /b 1
    )
) else (
    echo  [OK] 使用現有 .env
)

REM 確保預設模型
powershell -NoProfile -Command ^
  "(Get-Content .env) -replace '^OLLAMA_DEFAULT_MODEL=.*','OLLAMA_DEFAULT_MODEL=%DEFAULT_MODEL%' -replace '^DEFAULT_MODELS=.*','DEFAULT_MODELS=%DEFAULT_MODEL%' -replace '^COMPOSE_PROFILES=.*','COMPOSE_PROFILES=cpu' | Set-Content .env" 2>nul
echo.

REM --- 4. 啟動服務 ---
echo [4/6] 啟動服務 Starting services（首次約 5-15 分鐘）...

set COMPOSE_PROFILES=cpu
docker compose --profile cpu pull
if errorlevel 1 (
    echo  [!] docker compose pull 失敗
    pause
    exit /b 1
)

docker compose --profile cpu up -d --build
if errorlevel 1 (
    echo  [!] docker compose up 失敗
    echo  常見原因: 端口 %WEBUI_PORT% 被佔用，或 WSL2 未啟用
    pause
    exit /b 1
)
echo  [OK] 服務已啟動 Services started.
echo.

REM --- 5. 下載模型 ---
echo [5/6] 下載 AI 模型 Downloading %DEFAULT_MODEL%（約 2GB）...

echo  等待 Ollama 就緒 Waiting for Ollama...
set /a OW=0
:wait_ollama
timeout /t 3 /nobreak >nul
set /a OW+=3
docker compose --profile cpu exec -T ollama ollama list >nul 2>&1
if not errorlevel 1 goto pull_model
if !OW! geq 60 goto pull_model
goto wait_ollama

:pull_model
docker compose --profile cpu exec -T ollama ollama pull %DEFAULT_MODEL%
if errorlevel 1 (
    echo  [!] 模型下載失敗，可稍後手動執行:
    echo      docker compose exec ollama ollama pull %DEFAULT_MODEL%
) else (
    echo  [OK] 模型 %DEFAULT_MODEL% 已就緒.
)
echo.

REM --- 6. 開啟瀏覽器 ---
echo [6/6] 開啟 Open WebUI...

echo.
echo  ========================================================
echo    部署完成 Setup complete!
echo  ========================================================
echo.
echo    Open WebUI: %WEBUI_URL%
echo    預設模型:   %DEFAULT_MODEL%
echo.
echo    首次使用 First-time:
echo    1. 瀏覽器會自動開啟
echo    2. 建立管理員帳號 Create admin account
echo    3. 開始使用 Start using AI!
echo.
echo    支援 Support: team@insiderflow.asia
echo  ========================================================
echo.

start "" "%WEBUI_URL%"

pause
endlocal
