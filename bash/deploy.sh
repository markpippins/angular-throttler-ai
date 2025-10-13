#!/usr/bin/env bash
set -euo pipefail

# Deploy script — currently packages the app and prints next steps.
# You can extend this to upload artifacts to GitHub Releases, S3, etc.

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT="$SCRIPT_DIR/.."

echo "Packaging application before deploy..."
"$PROJECT_ROOT/bash/package.sh"

echo "Package created under ./dist."
echo "Deployment placeholder: implement your upload/publish steps here (GitHub Releases, S3, etc)."

