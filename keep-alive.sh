#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS='--max-old-space-size=1024' npx next start -p 3000 >> dev.log 2>&1
  echo "[$(date)] Server died, restarting in 3s..." >> dev.log
  sleep 3
done
