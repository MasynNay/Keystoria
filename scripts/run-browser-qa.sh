#!/usr/bin/env bash
# Run the same browser checks as the Pages gate against the checked-out site.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m http.server 8765 --bind 127.0.0.1 --directory site >/tmp/keystoria-local-qa.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 20); do
 if curl --fail --silent http://127.0.0.1:8765/ >/dev/null; then break; fi
 if ! kill -0 "$server_pid" 2>/dev/null; then echo "QA server failed to start. Is port 8765 already in use?" >&2; exit 1; fi
 sleep 0.25
done
curl --fail --silent --show-error http://127.0.0.1:8765/ >/dev/null
node scripts/test-release-browser.mjs
node scripts/test-release-negative.mjs
node scripts/test-vocabulary-browser.mjs
node scripts/test-lyric-recovery.mjs
node scripts/test-dialog-keyboard.mjs
node scripts/test-navigation-accessibility.mjs
node scripts/test-speed-mobile-performance.mjs
echo "PASS: Keystoria local browser QA completed."
