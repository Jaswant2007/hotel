#!/usr/bin/env bash
# One-shot local runner for Hotel Sri Vari (Mac/Linux/Git-Bash)
# Usage: ./start.sh
set -e
cd "$(dirname "$0")"

echo "▶ Installing dependencies (first run only)…"
(cd server && npm install --no-audit --no-fund)
(cd client && npm install --no-audit --no-fund)

echo "▶ Starting database (port 27017)…"
(cd server && npm run db > .data/db.log 2>&1 &)
sleep 2

echo "▶ Seeding menu + staff account…"
(cd server && npm run seed)

echo "▶ Starting API (port 4000)…"
(cd server && npm start > .data/api.log 2>&1 &)

echo "▶ Building & serving website (port 5173)…"
(cd client && npm run build && npm run preview > /tmp/hsv-preview.log 2>&1 &)

sleep 3
echo ""
echo "✅ All set — open:  http://localhost:5173"
echo "   Staff login:     staff@hotelsrivar.com / staff123"
echo "   Logs: server/.data/db.log, server/.data/api.log, /tmp/hsv-preview.log"
