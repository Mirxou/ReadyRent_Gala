# Complete startup script for ReadyRent.Gala
# Handles virtual environment activation and starts all services

param(
    [switch]$NoNgrok,
    [switch]$NoBackend,
    [switch]$NoFrontend
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ReadyRent.Gala - Complete Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    exit 1
}

# Find and activate virtual environment for Backend
$venvActivated = $false
if (-not $NoBackend) {
    Write-Host ""
    Write-Host "Setting up Backend..." -ForegroundColor Cyan
    
    $venvPath = $null
    if (Test-Path "$ProjectRoot\backend\venv") {
        $venvPath = "$ProjectRoot\backend\venv"
    } elseif (Test-Path "$ProjectRoot\backend\.venv") {
        $venvPath = "$ProjectRoot\backend\.venv"
    } elseif (Test-Path "$ProjectRoot\venv") {
        $venvPath = "$ProjectRoot\venv"
    }
    
    if ($venvPath) {
        Write-Host "   Found virtual environment: $venvPath" -ForegroundColor Gray
        $activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
        if (Test-Path $activateScript) {
            & $activateScript
            $venvActivated = $true
            Write-Host "   ✅ Virtual environment activated" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠️  No virtual environment found" -ForegroundColor Yellow
        Write-Host "   Please create one first:" -ForegroundColor Gray
        Write-Host "     cd backend" -ForegroundColor White
        Write-Host "     python -m venv venv" -ForegroundColor White
        Write-Host "     .\venv\Scripts\Activate.ps1" -ForegroundColor White
        Write-Host "     pip install -r requirements.txt" -ForegroundColor White
    }
    
    # Check Django installation
    if ($venvActivated) {
        try {
            $djangoVersion = python -c "import django; print(django.get_version())" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Django: $djangoVersion" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Django not installed in virtual environment" -ForegroundColor Red
                Write-Host "   Install with: pip install -r requirements.txt" -ForegroundColor Yellow
                $NoBackend = $true
            }
        } catch {
            Write-Host "   ❌ Django not installed in virtual environment" -ForegroundColor Red
            $NoBackend = $true
        }
    } else {
        Write-Host "   ⚠️  Skipping Django check (no venv)" -ForegroundColor Yellow
    }
}

# Check Frontend dependencies
if (-not $NoFrontend) {
    Write-Host ""
    Write-Host "Setting up Frontend..." -ForegroundColor Cyan
    
    if (Test-Path "$ProjectRoot\frontend\node_modules") {
        Write-Host "   ✅ node_modules found" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  node_modules not found" -ForegroundColor Yellow
        Write-Host "   Installing dependencies..." -ForegroundColor Yellow
        Set-Location "$ProjectRoot\frontend"
        npm install
        Set-Location $ProjectRoot
    }
}

Write-Host ""

# Start Backend
if (-not $NoBackend) {
    Write-Host "[1] Starting Django Backend..." -ForegroundColor Yellow
    
    $backendScript = @"
cd "$ProjectRoot\backend"
"@
    
    if ($venvActivated -and $venvPath) {
        $backendScript += @"

& "$venvPath\Scripts\python.exe" manage.py runserver 8000
"@
    } else {
        $backendScript += @"

python manage.py runserver 8000
"@
    }
    
    $backendScript += @"

pause
"@
    
    Start-Process powershell -ArgumentList "-NoExit","-Command",$backendScript
    Start-Sleep -Seconds 1
    Write-Host "   ✅ Backend window opened" -ForegroundColor Green
}

# Start Frontend
if (-not $NoFrontend) {
    Write-Host "[2] Starting Next.js Frontend..." -ForegroundColor Yellow
    
    $frontendScript = @"
cd "$ProjectRoot\frontend"
npm run dev
pause
"@
    
    Start-Process powershell -ArgumentList "-NoExit","-Command",$frontendScript
    Start-Sleep -Seconds 1
    Write-Host "   ✅ Frontend window opened" -ForegroundColor Green
}

# Start ngrok
if (-not $NoNgrok) {
    Write-Host "[3] Starting ngrok..." -ForegroundColor Yellow
    
    try {
        $null = ngrok version 2>&1
        
        $ngrokScript = @"
cd "$ProjectRoot"
ngrok http 8000
pause
"@
        
        Start-Process powershell -ArgumentList "-NoExit","-Command",$ngrokScript
        Start-Sleep -Seconds 1
        Write-Host "   ✅ ngrok window opened" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  ngrok not found (skipping)" -ForegroundColor Yellow
        Write-Host "      Install: https://ngrok.com/download" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services are running in separate PowerShell windows." -ForegroundColor Green
Write-Host ""
Write-Host "After services start, you can access:" -ForegroundColor Cyan
if (-not $NoBackend) {
    Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Yellow
}
if (-not $NoFrontend) {
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Yellow
}
if (-not $NoNgrok) {
    Write-Host "  ngrok UI: http://localhost:4040" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Update .env file with ngrok URL:" -ForegroundColor Cyan
    Write-Host "  BACKEND_URL=<ngrok-url>" -ForegroundColor White
    Write-Host "  FRONTEND_URL=<ngrok-url>" -ForegroundColor White
}
Write-Host ""
Write-Host "Press any key to exit this script (services will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
