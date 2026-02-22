#!/usr/bin/env powershell
# Script para iniciar MySQL via XAMPP

Write-Host "🔧 LabGrandisol - Iniciando MySQL..." -ForegroundColor Cyan
Write-Host ""

# Verifica se XAMPP está instalado
if (-Not (Test-Path "C:\xampp\mysql\bin\mysqld.exe")) {
  Write-Host "❌ XAMPP não encontrado em C:\xampp" -ForegroundColor Red
  Write-Host "   Instale XAMPP e tente novamente" -ForegroundColor Yellow
  exit 1
}

# Verifica se MySQL já está rodando
$mysqlProcess = Get-Process | Where-Object {$_.Name -like "*mysqld*"}
if ($mysqlProcess) {
  Write-Host "⚠️  MySQL já está rodando (PID: $($mysqlProcess.Id))" -ForegroundColor Yellow
  Write-Host ""
  $response = Read-Host "Deseja reiniciar? (s/n)"
  if ($response -eq "s") {
    Write-Host "Parando MySQL..." -ForegroundColor Yellow
    Stop-Process -Name mysqld -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  } else {
    exit 0
  }
}

# Inicia MySQL
Write-Host "Iniciando MySQL em background..." -ForegroundColor Green
Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList '--datadir="C:\xampp\mysql\data" --port=3306' -NoNewWindow

# Aguarda inicialização
Write-Host "Aguardando MySQL responder..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Testa conexão
$attempt = 0
while ($attempt -lt 5) {
  try {
    $output = & "C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT VERSION();" 2>&1
    if ($LASTEXITCODE -eq 0) {
      Write-Host "✅ MySQL iniciado com sucesso!" -ForegroundColor Green
      Write-Host ""
      Write-Host "Versão: $($output[-2])" -ForegroundColor Cyan
      Write-Host "Porta: 3306" -ForegroundColor Cyan
      Write-Host "Database: labgrandisol" -ForegroundColor Cyan
      Write-Host ""
      Write-Host "Próximos passos:" -ForegroundColor Green
      Write-Host "1. cd backend && npm install" -ForegroundColor White
      Write-Host "2. npm start" -ForegroundColor White
      Write-Host "3. Em outro terminal: cd frontend && npm install && npm run dev" -ForegroundColor White
      Write-Host ""
      
      # Mantém a janela aberta se for em GUI
      if ($host.Name -eq "ConsoleHost") {
        Write-Host "Pressione CTRL+C para parar MySQL" -ForegroundColor Yellow
        while ($true) { Start-Sleep -Seconds 10 }
      }
      exit 0
    }
  } catch {
    $attempt++
    if ($attempt -lt 5) {
      Write-Host "Tentativa $attempt/5..." -ForegroundColor Yellow
      Start-Sleep -Seconds 2
    }
  }
}

Write-Host "❌ Falha ao conectar no MySQL" -ForegroundColor Red
exit 1
