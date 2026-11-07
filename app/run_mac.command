#!/bin/bash
# Launch the local development server without clobbering another running copy.
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8080}"

# A suspended (^Z) server still owns its listening socket on macOS.
if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN -t | grep -q '[0-9]'; then
  echo "KEYSTORIA cannot start: port ${PORT} is already in use."
  echo "Stop the existing server with Control+C (not Control+Z), or use a free port:"
  echo "  PORT=8081 bash run_mac.command"
  exit 1
fi

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
.venv/bin/python -m pip install -r requirements.txt
(sleep 2; open "http://localhost:${PORT}") &
exec .venv/bin/python -m server.app
