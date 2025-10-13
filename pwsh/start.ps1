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

Write-Output "Installing dependencies with bun (if needed)..."
bun install

Write-Output "Starting application via 'bun run start' (maps to 'electron .')"
bun run start
