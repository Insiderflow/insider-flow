#!/bin/bash

set -euo pipefail

BASE_DIR="/Users/kenyeung/Documents/Insider Flow/insider-flow"
JOB_LABEL="com.insiderflow.openinsider"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$LAUNCH_AGENTS_DIR/$JOB_LABEL.plist"
SCRIPT_PATH="$BASE_DIR/scripts/run_openinsider_only.sh"
LOG_DIR="$BASE_DIR/scripts/logs"

mkdir -p "$LAUNCH_AGENTS_DIR"
mkdir -p "$LOG_DIR"

if [ ! -f "$SCRIPT_PATH" ]; then
  echo "Missing script: $SCRIPT_PATH"
  exit 1
fi

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$JOB_LABEL</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SCRIPT_PATH</string>
  </array>

  <key>StartInterval</key>
  <integer>900</integer>

  <key>RunAtLoad</key>
  <true/>

  <key>WorkingDirectory</key>
  <string>$BASE_DIR/web</string>

  <key>StandardOutPath</key>
  <string>$LOG_DIR/openinsider_launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/openinsider_launchd.err.log</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
</dict>
</plist>
EOF

if launchctl print "gui/$(id -u)/$JOB_LABEL" >/dev/null 2>&1; then
  launchctl bootout "gui/$(id -u)" "$PLIST_PATH" || true
fi

launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl enable "gui/$(id -u)/$JOB_LABEL"
launchctl kickstart -k "gui/$(id -u)/$JOB_LABEL"

echo "Installed launchd job: $JOB_LABEL"
echo "Plist: $PLIST_PATH"
echo "Status: launchctl print gui/$(id -u)/$JOB_LABEL | head -n 30"
