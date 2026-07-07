#!/bin/bash
cd /home/z/my-project
echo "[$(date)] Keep-alive starting..." > /home/z/my-project/keepalive.log
while true; do
  node node_modules/.bin/next dev -p 3000 -H 0.0.0.0 --turbopack </dev/null >> /home/z/my-project/dev.log 2>&1
  echo "[$(date)] Server died, restarting in 2s..." >> /home/z/my-project/keepalive.log
  sleep 2
done
