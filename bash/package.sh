#!/usr/bin/env bash
set -euo pipefail

# Package the Electron application using bun and electron-builder

if ! command -v bun >/dev/null 2>&1; then
  echo "bun is not installed. Please install Bun first: https://bun.sh/"
  exit 1
fi

echo "Installing dependencies with bun..."
bun install

echo "Packaging application (electron-builder)..."
bun run build

echo "Packaging finished. See ./dist for output."
