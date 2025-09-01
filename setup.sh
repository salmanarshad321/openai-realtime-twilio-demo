#!/usr/bin/env bash
set -euo pipefail

# Simple setup helper for the OpenAI Realtime + Twilio demo
# Usage: ./setup.sh

root_dir="$(cd "$(dirname "$0")" && pwd)"

function ensure_env() {
  local dir="$1"; shift
  local example="$dir/.env.example"
  local target="$dir/.env"
  if [[ -f "$target" ]]; then
    echo "[skip] $target already exists"
  else
    if [[ -f "$example" ]]; then
      cp "$example" "$target"
      echo "[create] Copied $example -> $target"
    else
      echo "[warn] No .env.example found in $dir"
    fi
  fi
}

echo "== Ensuring .env files =="
ensure_env "$root_dir/webapp"
ensure_env "$root_dir/websocket-server"

echo "== Installing dependencies (webapp) =="
(cd "$root_dir/webapp" && npm install)

echo "== Installing dependencies (websocket-server) =="
(cd "$root_dir/websocket-server" && npm install)

echo "\nSetup complete. Next steps:"
cat <<'EOS'
1. Fill in credentials:
   - webapp/.env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
   - websocket-server/.env: OPENAI_API_KEY
2. Start services (in separate terminals):
   - (A) cd webapp && npm run dev
   - (B) cd websocket-server && npm run dev
3. Run ngrok to expose port 8081:
   ngrok http 8081
4. Copy the https forwarding URL into websocket-server/.env as PUBLIC_URL and restart server.
5. In the web UI, configure Twilio number: set voice URL to: https://<your-forwarding-host>/twiml
6. Place a call to your Twilio number and watch logs in the webapp.
EOS
