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

Write-Output "Packaging application (electron-builder)..."
bun run build

Write-Output "Packaging finished. See ./dist for output."
