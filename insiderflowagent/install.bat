@echo off
REM ============================================================
REM  私域 AI Agent — Windows 一鍵部署
REM  需要 Docker Desktop + WSL2 backend
REM
REM  用法: 雙擊此檔案，或在 cmd 執行 install.bat
REM ============================================================

setlocal EnableDelayedExpansion

set "DEFAULT_MODEL=qwen2.5:3b"
set "PROFILE=cpu"
set "WEBUI_PORT=3000"
set "OLLAMA_PORT=11434"
set "WEBUI_URL=http://localhost:%WEBUI_PORT%"
set "MODEL_PULL_OK=0"
set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

echo.
echo  ========================================================
echo    公司內部私有 AI 助手
echo    似 ChatGPT，但數據永遠留喺公司
echo  ========================================================
echo.

cd /d "%INSTALL_DIR%" 2>nul
if errorlevel 1 (
    echo  [ERROR] 無法進入安裝目錄 Cannot cd to install dir.
    goto :troubleshoot
)

REM --- 0. 檢查必要檔案 ---
echo [1/7] 檢查部署檔 Checking files...

if not exist "docker-compose.yml" (
    echo.
    echo  [ERROR] 找不到 docker-compose.yml
    echo  [ERROR] Missing docker-compose.yml
    echo.
    echo  請確保 install.bat 同 docker-compose.yml 喺同一個資料夾。
    echo  或從 https://www.insiderflow.asia/ai-agent 下載完整 package 解壓。
    echo.
    goto :troubleshoot
)

findstr /C:"if-agent-ollama" docker-compose.yml >nul 2>&1
if errorlevel 1 (
    echo  [!] 警告: docker-compose.yml 可能係舊版本
    echo  [!] Warning: compose file may be outdated
) else (
    echo  [OK] Open WebUI -^> Ollama 設定正確
)

if not exist ".env.example" (
    echo  [ERROR] 找不到 .env.example
    goto :troubleshoot
)
echo  [OK] 部署檔齊全 Files OK.
echo.

REM --- 1. 檢查 Docker ---
echo [2/7] 檢查 Docker Desktop...

where docker >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERROR] 未偵測到 Docker / Docker not found.
    echo.
    echo  請先安裝 Docker Desktop 並啟用 WSL2:
    echo  https://www.docker.com/products/docker-desktop/
    echo.
    echo  安裝後重新雙擊 install.bat
    goto :troubleshoot
)

call :wait_for_docker
if errorlevel 1 goto :troubleshoot
echo  [OK] Docker 已就緒 Docker is ready.
echo.

REM --- 2. 檢查 docker compose ---
echo [3/7] 檢查 Docker Compose...

docker compose version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] 找不到 docker compose，請更新 Docker Desktop。
    goto :troubleshoot
)
echo  [OK] Docker Compose 已就緒.
echo.

REM --- 3. 設定 .env ---
echo [4/7] 設定環境 Setting up .env...

if not exist ".env" (
    copy /Y ".env.example" ".env" >nul
    echo  [OK] 已建立 .env
) else (
    echo  [OK] 使用現有 .env
)

powershell -NoProfile -Command ^
  "$c=Get-Content .env; $c=$c -replace '^OLLAMA_DEFAULT_MODEL=.*','OLLAMA_DEFAULT_MODEL=%DEFAULT_MODEL%' -replace '^DEFAULT_MODELS=.*','DEFAULT_MODELS=%DEFAULT_MODEL%' -replace '^COMPOSE_PROFILES=.*','COMPOSE_PROFILES=%PROFILE%'; $c | Set-Content .env" 2>nul

REM 讀取 WEBUI_PORT（如有自訂）
for /f "usebackq tokens=1,* delims==" %%A in (`findstr /B "OPENWEBUI_PORT=" .env 2^>nul`) do set "WEBUI_PORT=%%B"
set "WEBUI_URL=http://localhost:!WEBUI_PORT!"
echo  Open WebUI URL: !WEBUI_URL!
echo.

REM --- 4. 啟動服務 ---
echo [5/7] 啟動服務 Starting services（首次約 5-15 分鐘）...

set COMPOSE_PROFILES=%PROFILE%
docker compose --profile %PROFILE% pull
if errorlevel 1 (
    echo  [ERROR] docker compose pull 失敗
    echo  檢查網絡連線 / Check network connection
    goto :troubleshoot
)

docker compose --profile %PROFILE% up -d --build
if errorlevel 1 (
    echo  [ERROR] docker compose up 失敗
    echo.
    echo  常見原因 Common causes:
    echo    - 端口 !WEBUI_PORT! 已被佔用 Port already in use
    echo    - WSL2 未啟用 WSL2 not enabled
    echo    - 硬碟空間不足 Not enough disk space
    echo.
    echo  修改 .env 入面 OPENWEBUI_PORT=3080 後再試
    goto :troubleshoot
)
echo  [OK] 服務已啟動 Services started.
echo.

REM --- 5. 下載模型 ---
echo [6/7] 下載 AI 模型 Downloading %DEFAULT_MODEL%...

call :wait_for_ollama
if errorlevel 1 (
    echo  [!] Ollama 未完全就緒，仍會嘗試 pull...
)

echo  正在 pull %DEFAULT_MODEL%（約 2GB）...
docker compose --profile %PROFILE% exec -T ollama ollama pull %DEFAULT_MODEL%
if errorlevel 1 (
    echo.
    echo  [!] 模型下載失敗（部署會繼續）Model pull failed - setup continues
    echo  稍後手動執行 Manual retry:
    echo    docker compose exec ollama ollama pull %DEFAULT_MODEL%
    set "MODEL_PULL_OK=0"
) else (
    call :verify_model
)
echo.

REM --- 6. 等待 WebUI + 開啟瀏覽器 ---
echo [7/7] 等待 Open WebUI 並開啟瀏覽器...

call :wait_for_webui

echo.
echo  ========================================================
echo    部署完成！公司私有 AI 助手已就緒
echo    Setup complete! Private AI assistant is ready
echo  ========================================================
echo.
echo    Open WebUI: !WEBUI_URL!
echo    預設模型:   %DEFAULT_MODEL%
if "!MODEL_PULL_OK!"=="1" (
    echo    模型狀態:   [OK] 已就緒
) else (
    echo    模型狀態:   [!] 請手動 pull 模型
)
echo.
echo    首次使用 First-time:
echo    1. 瀏覽器會自動開啟
echo    2. 建立管理員帳號 Create admin account
echo    3. Upload 公司文件 HR/SOP 開始知識庫問答
echo    4. 揀模型 %DEFAULT_MODEL% 同 AI 對話
echo.
echo    需要 AI Agent 工作流? WhatsApp / team@insiderflow.asia
echo.
echo    支援 Support: team@insiderflow.asia
echo  ========================================================
echo.

call :open_browser !WEBUI_URL!

pause
exit /b 0

REM ============================================================
REM  子程序 Subroutines
REM ============================================================

:wait_for_docker
docker info >nul 2>&1
if not errorlevel 1 exit /b 0

echo  [!] Docker 未運行，嘗試啟動 Docker Desktop...
echo  [!] Docker not running, starting Docker Desktop...

set "DOCKER_EXE="
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    set "DOCKER_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
) else if exist "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe" (
    set "DOCKER_EXE=%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe"
)

if defined DOCKER_EXE (
    start "" "!DOCKER_EXE!"
) else (
    echo  [ERROR] 找不到 Docker Desktop.exe，請手動啟動。
    exit /b 1
)

echo  等待 Docker 啟動 Waiting for Docker（最多 180 秒）...
set /a WAIT=0
:wait_docker_loop
timeout /t 5 /nobreak >nul
set /a WAIT+=5

docker info >nul 2>&1
if not errorlevel 1 (
    echo  [OK] Docker 已啟動（等了 !WAIT! 秒）
    exit /b 0
)

REM 每 15 秒提示一次
set /a MOD=!WAIT! %% 15
if !MOD! equ 0 echo    ...已等 !WAIT! 秒 / 180s

if !WAIT! geq 180 (
    echo  [ERROR] Docker 啟動超時（180 秒）
    echo.
    echo  請確認:
    echo    1. Docker Desktop 已完全啟動（tray 見 whale icon）
    echo    2. Settings -^> General -^> Use WSL 2 based engine 已勾選
    echo    3. Settings -^> Resources -^> WSL Integration 已開啟
    exit /b 1
)
goto :wait_docker_loop

:wait_for_ollama
echo  等待 Ollama 就緒 Waiting for Ollama（最多 120 秒）...
set /a OW=0

:wait_ollama_loop
REM Phase 1: container running
docker inspect -f "{{.State.Status}}" if-agent-ollama >nul 2>&1
if errorlevel 1 (
    goto :ollama_not_ready_yet
)

for /f "delims=" %%S in ('docker inspect -f "{{.State.Status}}" if-agent-ollama 2^>nul') do set "OLLAMA_STATUS=%%S"
if /I not "!OLLAMA_STATUS!"=="running" goto :ollama_not_ready_yet

REM Phase 2: health (optional)
for /f "delims=" %%H in ('docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" if-agent-ollama 2^>nul') do set "OLLAMA_HEALTH=%%H"
if /I "!OLLAMA_HEALTH!"=="starting" goto :ollama_not_ready_yet
if /I "!OLLAMA_HEALTH!"=="unhealthy" (
    echo  [!] Ollama health: unhealthy（仍會嘗試 API）
)

REM Phase 3: API
docker compose --profile %PROFILE% exec -T ollama ollama list >nul 2>&1
if not errorlevel 1 (
    echo  [OK] Ollama API 已就緒（等了 !OW! 秒）
    exit /b 0
)

:ollama_not_ready_yet
timeout /t 3 /nobreak >nul
set /a OW+=3
set /a MOD=!OW! %% 15
if !MOD! equ 0 echo    ...已等 !OW! 秒 / 120s

if !OW! geq 120 (
    echo  [!] Ollama 等待超時
    echo  日誌 Logs: docker compose logs ollama
    exit /b 1
)
goto :wait_ollama_loop

:verify_model
docker compose --profile %PROFILE% exec -T ollama ollama list 2>nul | findstr /I /C:"%DEFAULT_MODEL%" >nul
if not errorlevel 1 (
    echo  [OK] 模型 %DEFAULT_MODEL% 已確認存在
    set "MODEL_PULL_OK=1"
    exit /b 0
)
docker compose --profile %PROFILE% exec -T ollama ollama list 2>nul | findstr /I /C:"qwen2.5" >nul
if not errorlevel 1 (
    echo  [OK] 模型 qwen2.5 已確認存在
    set "MODEL_PULL_OK=1"
    exit /b 0
)
echo  [!] Pull 完成但驗證未找到模型，請檢查 ollama list
exit /b 1

:wait_for_webui
set /a WU=0
:wait_webui_loop
powershell -NoProfile -Command ^
  "try { $r=Invoke-WebRequest -Uri '!WEBUI_URL!' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
    echo  [OK] Open WebUI 可訪問 WebUI reachable
    exit /b 0
)

timeout /t 3 /nobreak >nul
set /a WU+=3
if !WU! geq 120 (
    echo  [!] Open WebUI 等待超時，仍會嘗試開瀏覽器
    echo  請稍等 30 秒後手動開啟: !WEBUI_URL!
    exit /b 1
)
goto :wait_webui_loop

:open_browser
set "URL=%~1"
echo  開啟瀏覽器 Opening browser...
start "" "%URL%"
if errorlevel 1 (
    echo  [!] 無法自動開啟，請手動前往: %URL%
)
exit /b 0

:troubleshoot
echo.
echo  -------- 常見問題 Troubleshooting --------
echo.
echo  1. Docker Desktop 未啟動
echo     -^> 等 tray 見 whale icon 變綠再試
echo.
echo  2. WSL2 未啟用
echo     -^> Docker Desktop -^> Settings -^> General -^> Use WSL 2
echo.
echo  3. 端口 3000 被佔用
echo     -^> 改 .env OPENWEBUI_PORT=3080
echo.
echo  4. 模型下載失敗
echo     -^> docker compose exec ollama ollama pull qwen2.5:3b
echo.
echo  5. Open WebUI 連唔到 Ollama
echo     -^> 確認 docker-compose.yml 有 OLLAMA_BASE_URL=http://if-agent-ollama:11434
echo.
echo  支援 Support: team@insiderflow.asia
echo.
pause
exit /b 1
