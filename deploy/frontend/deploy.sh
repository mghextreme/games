#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/game-rooms}"
SERVICE_NAME="game-rooms-frontend"

echo "==> Pulling latest changes..."
cd "$REPO_DIR"
git pull

echo "==> Installing dependencies..."
cd frontend
pnpm install --frozen-lockfile

echo "==> Building frontend..."
pnpm build

echo "==> Restarting service..."
sudo systemctl restart "$SERVICE_NAME"

echo "==> Done. Checking status..."
sudo systemctl status "$SERVICE_NAME" --no-pager
