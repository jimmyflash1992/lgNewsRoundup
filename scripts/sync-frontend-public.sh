#!/usr/bin/env bash
set -euo pipefail

# Syncs static assets from the repo root into frontend/public so the Astro site
# matches the original static layout and data.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$ROOT_DIR/frontend/public"
ASSETS=("app.js" "feed.xml" "favicon.png" "logo.svg")

mkdir -p "$PUBLIC_DIR"

for asset in "${ASSETS[@]}"; do
  SOURCE="$ROOT_DIR/$asset"
  TARGET="$PUBLIC_DIR/$asset"

  if [ ! -f "$SOURCE" ]; then
    echo "warning: missing source asset $asset" >&2
    continue
  fi

  cp "$SOURCE" "$TARGET"
  echo "synced $asset"
done
