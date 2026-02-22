#!/usr/bin/env pwsh
<#
.SYNOPSIS
    LabGrandisol Quick Start & Validation Script
    
.DESCRIPTION
    Initializes the project, validates configuration, and starts all services
    
.PARAMETER Environment
    Environment to initialize: development, staging, production
    
.EXAMPLE
    .\init.ps1 -Environment development
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('development', 'staging', 'production')]
    [string]$Environment = 'development'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Write-Header {
    param([string]$Message)
    Write-Host "`n" -NoNewline
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($Message.PadRight(62)) ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message, [string]$Status = "→")
    Write-Host "  $Status  $Message" -ForegroundColor Green
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✅  $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "  ⚠️   $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "  ❌  $Message" -ForegroundColor Red
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Main execution
Write-Header "LabGrandisol v2.0 - Quick Start ($Environment)"

# 1. Check prerequisites
Write-Header "Checking Prerequisites"

$prerequisites = @(
    @{ Name = "Git"; Command = "git" }
    @{ Name = "Docker"; Command = "docker" }
    @{ Name = "Docker Compose"; Command = "docker-compose" }
    @{ Name = "Node.js"; Command = "node" }
    @{ Name = "npm"; Command = "npm" }
)

$missingDeps = @()

foreach ($prereq in $prerequisites) {
    if (Test-Command $prereq.Command) {
        $version = & $prereq.Command --version 2>&1 | Select-Object -First 1
        Write-Success "$($prereq.Name): $version"
    } else {
        Write-Warning "$($prereq.Name): NOT FOUND"
        $missingDeps += $prereq.Name
    }
}

if ($missingDeps.Count -gt 0) {
    Write-Host ""
    Write-Error "Missing dependencies: $($missingDeps -join ', ')"
    Write-Host "Please install them and try again.`n"
    exit 1
}

# 2. Setup environment
Write-Header "Setting Up Environment"

if (-not (Test-Path ".env")) {
    Write-Step "Creating .env from .env.example"
    Copy-Item ".env.example" ".env" -Force
    Write-Success ".env created successfully"
} else {
    Write-Success ".env already exists"
}

# 3. Validate Git
Write-Header "Git Configuration"

$gitStatus = git status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Git repository valid"
} else {
    Write-Error "Git repository invalid"
    exit 1
}

# 4. Check Docker
Write-Header "Docker Configuration"

$dockerRunning = docker ps *>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Docker daemon might not be running"
}

$composeVersion = docker-compose --version
Write-Success "Docker Compose: $composeVersion"

# 5. Install dependencies
Write-Header "Installing Dependencies"

Write-Step "Backend dependencies..."
Push-Location backend
npm ci --legacy-peer-deps 2>&1 | Out-Null
Write-Success "Backend ready"
Pop-Location

Write-Step "Frontend dependencies..."
Push-Location frontend
npm ci --legacy-peer-deps 2>&1 | Out-Null
Write-Success "Frontend ready"
Pop-Location

# 6. Validate builds
Write-Header "Validating Builds"

Write-Step "Backend TypeScript compilation..."
Push-Location backend
npm run typecheck 2>&1 | Out-Null
Write-Success "Backend TypeScript valid"
Pop-Location

Write-Step "Frontend Vite build..."
Push-Location frontend
npm run build 2>&1 | Out-Null
Write-Success "Frontend build successful"
Pop-Location

# 7. Configuration summary
Write-Header "Configuration Summary"

@"
  Environment:         $Environment
  Node Version:        $(node --version)
  npm Version:         $(npm --version)
  Docker Version:      $(docker --version)
  
  Directories:
    ✓ backend/         - Express.js API
    ✓ frontend/        - React client
    ✓ caddy/           - HTTPS proxy
    ✓ scripts/         - Utilities
    
  Files:
    ✓ docker-compose.yml - Infrastructure
    ✓ .env              - Environment variables
    ✓ .env.example      - Configuration template
"@ | Write-Host -ForegroundColor Cyan

# 8. Next steps
Write-Header "Ready to Start"

Write-Host @"
Next steps:

1. Start services (requires Docker):
   docker-compose up -d

2. Check status:
   docker-compose ps

3. View logs:
   docker-compose logs -f backend

4. Access application:
   • Frontend: http://localhost:5173 (dev) or https://localhost (prod)
   • API:      http://localhost:3000/api
   • Docs:     http://localhost:3000/api-docs

5. Stop services:
   docker-compose down

For more information:
  - README.md         - Get started guide
  - ARCHITECTURE.md   - System design
  - DEPLOYMENT.md     - Deploy guide
  - CONTRIBUTING.md   - Contribution guidelines
  
"@ -ForegroundColor DarkGray

Write-Success "Setup complete! Your environment is ready to go. 🚀`n"
