#!/usr/bin/env pwsh
Param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Bun {
    if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
        Write-Error "bun is not installed. Please install Bun first: https://bun.sh/"
        exit 1
    }
}

Ensure-Bun

Write-Output "Installing dependencies with bun..."
bun install

Write-Output "Running package build (electron-builder via 'bun run build')..."
bun run build

Write-Output "Build finished. Output directory: ./dist (per package.json 'build.directories.output')"
