#!/bin/bash
cd /home/z/my-project
while true; do
  echo "=== Server starting at $(date) ===" >> /home/z/my-project/dev.log
  bun run dev >> /home/z/my-project/dev.log 2>&1
  echo "=== Server died at $(date), restarting in 5s ===" >> /home/z/my-project/dev.log
  sleep 5
done