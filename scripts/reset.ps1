# Script PowerShell para resetar o projeto LabGrandisol (remove dados)

Set-StrictMode -Version Latest

$ProjectPath = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectPath

Write-Host ""
Write-Host "⚠️  AVISO: Este script vai REMOVER todos os dados (banco de dados, certificados)!" -ForegroundColor Red
$response = Read-Host "Deseja continuar? (s/n)"

if ($response -ne "s") {
    Write-Host "Cancelado."
    exit
}

Write-Host ""
Write-Host "Parando containers..." -ForegroundColor Yellow
docker compose -f "$ProjectPath\docker-compose.yml" down -v

Write-Host ""
Write-Host "✓ Projeto resetado! Execute up.ps1 para começar do zero." -ForegroundColor Green
Write-Host ""
pause
