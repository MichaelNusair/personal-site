#!/bin/sh
echo "=== Starting Internal Tools ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

if [ ! -f "server.js" ]; then
  echo "ERROR: server.js not found!"
  ls -la /app/
  exit 1
fi

echo "Starting Next.js server..."
exec node server.js
