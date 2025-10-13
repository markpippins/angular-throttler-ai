#!/usr/bin/env pwsh
Param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $scriptDir ".."

Write-Output "Packaging application before deploy..."
& (Join-Path $projectRoot 'pwsh\package.ps1')

Write-Output "Package created under ./dist."
Write-Output "Deployment placeholder: implement your upload/publish steps here (GitHub Releases, S3, etc)."
