#!/usr/bin/env bash
set -euo pipefail

# Non-interactive setup for Astro frontend in /frontend
# Run this from the repo root on branch `firstdraft`.

cd "$(dirname "$0")/.."

echo "Checking git branch..."
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "firstdraft" ]; then
  echo "You are on branch '$branch'. Please switch to 'firstdraft' and re-run."
  exit 1
fi

echo "Creating Astro project in ./frontend..."
# Use npm create with forced defaults where supported
npx create-astro@latest frontend -- --template blog --yes || (
  echo "npm create attempted interactive flow; retrying with --template blog..."
  npm create astro@latest frontend -- --template blog --yes
)

cd frontend
echo "Installing dependencies..."
npm install

echo "Adding Tailwind and sitemap integrations..."
npx astro add tailwind --yes || true
npx astro add sitemap --yes || true

echo "Copying brand assets to frontend/public..."
mkdir -p public
cp ../logo.svg public/logo.svg 2>/dev/null || true
cp ../favicon.png public/favicon.png 2>/dev/null || true

echo "Done. To start dev server:"
echo "  cd frontend && npm run dev -- --host 0.0.0.0 --port 4321"
