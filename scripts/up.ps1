# Script PowerShell para iniciar o projeto LabGrandisol

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Cores
$Green = 'Green'
$Red = 'Red'
$Yellow = 'Yellow'
$Cyan = 'Cyan'

# Função de escrita
function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
    Write-Host "║ $($Message.PadRight(52)) ║" -ForegroundColor $Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message, [string]$Status = "")
    if ($Status -eq "OK") {
        Write-Host "✓ $Message" -ForegroundColor $Green
    } elseif ($Status -eq "ERROR") {
        Write-Host "✗ $Message" -ForegroundColor $Red
    } else {
        Write-Host "▸ $Message" -ForegroundColor $Yellow
    }
}

# Main
Write-Section "LabGrandisol - Wiki Pessoal"

# Verificar Docker
Write-Step "Verificando Docker..."
try {
    docker --version | Out-Null
    Write-Step "Docker encontrado" "OK"
} catch {
    Write-Step "Docker não encontrado" "ERROR"
    exit 1
}

# Navegar para o diretório do projeto
$ProjectPath = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectPath
Write-Step "Diretório: $ProjectPath" "OK"

# Iniciar containers
Write-Step "Iniciando containers..."
docker compose -f "$ProjectPath\docker-compose.yml" up -d

Write-Step "Status dos containers:" "OK"
docker compose -f "$ProjectPath\docker-compose.yml" ps

Write-Host ""
Write-Host "🚀 Acesse: https://wiki.local" -ForegroundColor $Green
Write-Host ""

# Mostrar logs
Write-Step "Mostrando logs (CTRL+C para parar)..."
docker compose -f "$ProjectPath\docker-compose.yml" logs -f

pause
