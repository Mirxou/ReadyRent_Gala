#!/bin/bash
# STANDARD.Rent — Development Keep-Alive
# Automatically restarts the dev server on crash.
# Usage: ./keep-alive.sh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

LOG_FILE="$PROJECT_DIR/dev.log"
echo "[$(date)] Keep-alive starting..." >> "$LOG_FILE"

while true; do
  bun run dev >> "$LOG_FILE" 2>&1
  echo "[$(date)] Server died, restarting in 3s..." >> "$LOG_FILE"
  sleep 3
done
