#!/bin/bash

set -euo pipefail

JOB_LABEL="com.insiderflow.openinsider"
PLIST_PATH="$HOME/Library/LaunchAgents/$JOB_LABEL.plist"

if launchctl print "gui/$(id -u)/$JOB_LABEL" >/dev/null 2>&1; then
  launchctl bootout "gui/$(id -u)" "$PLIST_PATH" || true
fi

rm -f "$PLIST_PATH"

echo "Uninstalled launchd job: $JOB_LABEL"
