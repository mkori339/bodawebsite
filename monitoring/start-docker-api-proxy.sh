#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-23750}"
PID_FILE="/home/mkori/bodarequest/monitoring/docker-api-proxy.pid"
LOG_FILE="/home/mkori/bodarequest/monitoring/docker-api-proxy.log"
LISTEN_HOST="${DOCKER_PROXY_BIND:-0.0.0.0}"

candidate_sockets=()

if [[ -n "${DOCKER_DESKTOP_SOCKET:-}" ]]; then
  candidate_sockets+=("${DOCKER_DESKTOP_SOCKET}")
fi

candidate_sockets+=(
  "/run/docker.sock"
  "/var/run/docker.sock"
  "$HOME/.docker/desktop/docker.sock"
)

TARGET_SOCKET=""

for socket_path in "${candidate_sockets[@]}"; do
  if [[ -S "$socket_path" ]]; then
    TARGET_SOCKET="$socket_path"
    break
  fi
done

if [[ -z "$TARGET_SOCKET" ]]; then
  echo "No Docker socket found. Checked: ${candidate_sockets[*]}" >&2
  exit 1
fi

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Proxy already running with PID $(cat "$PID_FILE")"
  exit 0
fi

setsid socat \
  "TCP-LISTEN:${PORT},bind=${LISTEN_HOST},reuseaddr,fork" \
  "UNIX-CONNECT:${TARGET_SOCKET}" \
  >"$LOG_FILE" 2>&1 < /dev/null &

PROXY_PID=$!
sleep 1

if ! kill -0 "$PROXY_PID" 2>/dev/null; then
  echo "Failed to start Docker API proxy; see $LOG_FILE" >&2
  exit 1
fi

echo "$PROXY_PID" > "$PID_FILE"
echo "Started Docker API TCP proxy on ${LISTEN_HOST}:${PORT} using ${TARGET_SOCKET} with PID $PROXY_PID"
