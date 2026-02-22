#!/usr/bin/env powershell
# Script completo para iniciar LabGrandisol com XAMPP

param(
  [switch]$Backend,
  [switch]$Frontend,
  [switch]$All
)

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         LabGrandisol v2.0 - Setup XAMPP           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Se nenhuma opção, mostrar menu
if (-Not ($Backend -or $Frontend -or $All)) {
  Write-Host "Selecione o que iniciar:" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "1) Backend + Database" -ForegroundColor Green
  Write-Host "2) Frontend" -ForegroundColor Green
  Write-Host "3) Tudo (Backend + Frontend)" -ForegroundColor Green
  Write-Host "0) Sair" -ForegroundColor Red
  Write-Host ""
  
  $choice = Read-Host "Opção"
  
  switch ($choice) {
    "1" { $Backend = $true }
    "2" { $Frontend = $true }
    "3" { $All = $true }
    "0" { exit 0 }
    default { 
      Write-Host "Opção inválida" -ForegroundColor Red
      exit 1
    }
  }
}

# ===== BACKEND =====
if ($Backend -or $All) {
  Write-Host "🚀 Iniciando Backend..." -ForegroundColor Green
  Write-Host ""
  
  # Inicia MySQL
  Write-Host "1️⃣  Iniciando MySQL..." -ForegroundColor Yellow
  
  # Verifica se MySQL já está rodando
  $mysqlProcess = Get-Process | Where-Object {$_.Name -like "*mysqld*"} | Select-Object -First 1
  if (-Not $mysqlProcess) {
    Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" `
      -ArgumentList '--datadir="C:\xampp\mysql\data" --port=3306' `
      -NoNewWindow
    Start-Sleep -Seconds 3
  }
  
  Write-Host "   ✅ MySQL rodando" -ForegroundColor Green
  Write-Host ""
  
  # Instala dependências do backend
  Write-Host "2️⃣  Instalando dependências do backend..." -ForegroundColor Yellow
  Push-Location "$projectRoot\backend"
  npm install --quiet
  if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
  }
  Write-Host "   ✅ Dependências instaladas" -ForegroundColor Green
  Pop-Location
  Write-Host ""
  
  # Inicia backend
  Write-Host "3️⃣  Iniciando servidor backend..." -ForegroundColor Yellow
  Push-Location "$projectRoot\backend"
  
  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "Backend iniciado em: http://localhost:3001" -ForegroundColor Cyan
  Write-Host "API Health: http://localhost:3001/api/health" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host ""
  
  npm start
  exit $LASTEXITCODE
}

# ===== FRONTEND =====
if ($Frontend -or $All) {
  Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Green
  Write-Host ""
  
  Write-Host "1️⃣  Instalando dependências do frontend..." -ForegroundColor Yellow
  Push-Location "$projectRoot\frontend"
  npm install --quiet
  if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
  }
  Write-Host "   ✅ Dependências instaladas" -ForegroundColor Green
  Write-Host ""
  
  Write-Host "2️⃣  Iniciando servidor de desenvolvimento..." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "Frontend em desenvolvimento: http://localhost:5173" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host ""
  
  npm run dev
  exit $LASTEXITCODE
}
