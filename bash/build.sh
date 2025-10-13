#!/usr/bin/env bash
set -euo pipefail

# bun-based build script
# Installs dependencies (if needed) and runs the `build` script from package.json

if ! command -v bun >/dev/null 2>&1; then
	echo "bun is not installed. Please install Bun first: https://bun.sh/"
	exit 1
fi

echo "Installing dependencies with bun..."
bun install

echo "Running package build (electron-builder via 'bun run build')..."
bun run build

echo "Build finished. Output directory: ./dist (per package.json 'build.directories.output')"
