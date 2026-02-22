# Script PowerShell para parar o projeto LabGrandisol

Set-StrictMode -Version Latest

$ProjectPath = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectPath

Write-Host ""
Write-Host "⏹️  Parando containers..." -ForegroundColor Yellow

docker compose -f "$ProjectPath\docker-compose.yml" down

Write-Host "✓ Containers parados com sucesso!" -ForegroundColor Green
Write-Host ""
pause
