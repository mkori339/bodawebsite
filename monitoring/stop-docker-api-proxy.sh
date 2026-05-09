#!/usr/bin/env bash
set -euo pipefail

PID_FILE="/home/mkori/bodarequest/monitoring/docker-api-proxy.pid"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
  fi
  rm -f "$PID_FILE"
fi
