# Script to start Django Backend, Next.js Frontend, and ngrok
# For ReadyRent.Gala project

param(
    [switch]$NoNgrok
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Get-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ReadyRent.Gala - Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clean up any existing processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object {
    ($_.ProcessName -eq "python" -and $_.CommandLine -like "*manage.py*runserver*") -or
    ($_.ProcessName -eq "node" -and $_.CommandLine -like "*next*dev*") -or
    ($_.ProcessName -eq "ngrok")
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

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

# Check ngrok
$ngrokInstalled = $false
if (-not $NoNgrok) {
    try {
        $null = ngrok version 2>&1
        $ngrokInstalled = $true
        Write-Host "✅ ngrok: Installed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  ngrok: Not installed (skipping)" -ForegroundColor Yellow
        Write-Host "   Install: https://ngrok.com/download" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "[1/3] Starting Django Backend..." -ForegroundColor Yellow
$backendProc = Start-Process -FilePath "python" `
    -ArgumentList "manage.py", "runserver", "8000" `
    -WorkingDirectory "$ProjectRoot\backend" `
    -PassThru `
    -WindowStyle Hidden `
    -NoNewWindow
Start-Sleep -Seconds 2
Write-Host "       Backend process started (PID: $($backendProc.Id))" -ForegroundColor Gray

# Start Frontend
Write-Host "[2/3] Starting Next.js Frontend..." -ForegroundColor Yellow
$frontendProc = Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory "$ProjectRoot\frontend" `
    -PassThru `
    -WindowStyle Hidden `
    -NoNewWindow
Start-Sleep -Seconds 2
Write-Host "       Frontend process started (PID: $($frontendProc.Id))" -ForegroundColor Gray

# Start ngrok if installed
$ngrokProc = $null
if ($ngrokInstalled) {
    Write-Host "[3/3] Starting ngrok tunnel..." -ForegroundColor Yellow
    $ngrokProc = Start-Process -FilePath "ngrok" `
        -ArgumentList "http", "8000" `
        -PassThru `
        -WindowStyle Hidden `
        -NoNewWindow
    Start-Sleep -Seconds 3
    Write-Host "       ngrok process started (PID: $($ngrokProc.Id))" -ForegroundColor Gray
} else {
    Write-Host "[3/3] Skipping ngrok (not installed or disabled)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

# Check services status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendReady = $false
$frontendReady = $false
$ngrokReady = $false
$ngrokUrl = ""

# Check Backend
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 2 -ErrorAction Stop
        $backendReady = $true
        Write-Host "✅ Backend:  http://localhost:8000 - RUNNING" -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}
if (-not $backendReady) {
    Write-Host "⚠️  Backend:  http://localhost:8000 - Starting..." -ForegroundColor Yellow
}

# Check Frontend
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
        $frontendReady = $true
        Write-Host "✅ Frontend: http://localhost:3000 - RUNNING" -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}
if (-not $frontendReady) {
    Write-Host "⚠️  Frontend: http://localhost:3000 - Starting..." -ForegroundColor Yellow
}

# Check ngrok
if ($ngrokInstalled -and $ngrokProc) {
    for ($i = 0; $i -lt 5; $i++) {
        try {
            $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
            if ($tunnels.tunnels -and $tunnels.tunnels.Count -gt 0) {
                $ngrokUrl = $tunnels.tunnels[0].public_url
                $ngrokReady = $true
                Write-Host "✅ ngrok:    $ngrokUrl - RUNNING" -ForegroundColor Green
                break
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    if (-not $ngrokReady) {
        Write-Host "⚠️  ngrok:    Starting... (check http://localhost:4040)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Display ngrok URLs if available
if ($ngrokUrl) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ngrok Public URLs" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Backend:  $ngrokUrl" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Webhook URLs:" -ForegroundColor Cyan
    Write-Host "  BaridiMob:  $ngrokUrl/api/payments/webhooks/baridimob/" -ForegroundColor Yellow
    Write-Host "  Bank Card:  $ngrokUrl/api/payments/webhooks/bank-card/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Update .env file with:" -ForegroundColor Cyan
    Write-Host "  BACKEND_URL=$ngrokUrl" -ForegroundColor White
    Write-Host "  FRONTEND_URL=$ngrokUrl" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Services are running in background" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Gray
Write-Host ""

# Wait for Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
        # Periodically check if processes are still running
        if ($backendProc -and $backendProc.HasExited) {
            Write-Host "⚠️  Backend process exited!" -ForegroundColor Red
        }
        if ($frontendProc -and $frontendProc.HasExited) {
            Write-Host "⚠️  Frontend process exited!" -ForegroundColor Red
        }
        if ($ngrokProc -and $ngrokProc.HasExited) {
            Write-Host "⚠️  ngrok process exited!" -ForegroundColor Red
        }
    }
} finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    
    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Backend stopped" -ForegroundColor Gray
    }
    
    if ($frontendProc -and -not $frontendProc.HasExited) {
        Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Frontend stopped" -ForegroundColor Gray
    }
    
    if ($ngrokProc -and -not $ngrokProc.HasExited) {
        Stop-Process -Id $ngrokProc.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ ngrok stopped" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "All services stopped." -ForegroundColor Green
}
