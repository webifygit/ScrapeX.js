#!/usr/bin/env bash
# First deploy and every later update of scrapex.site on the Ubuntu server.
# Usage (on the server):  bash deploy/deploy.sh
# Safe to re-run: it pulls, installs, builds, then restarts the PM2 process.
set -euo pipefail

REPO="https://github.com/webifygit/ScrapeX.js.git"
APP_DIR="${APP_DIR:-/var/www/scrapex.site}"
BRANCH="${BRANCH:-main}"

if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "Installing Node.js 22 (Next.js needs Node 20.9 or newer)..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing PM2..."
  sudo npm install -g pm2
fi

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Cloning $REPO into $APP_DIR..."
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER":"$USER" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

npm ci
npm run build

pm2 startOrRestart deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true

echo
echo "Deployed. Next.js is listening on 127.0.0.1:3100."
echo "If nginx is not set up yet, see deploy/nginx/scrapex.site.conf."
