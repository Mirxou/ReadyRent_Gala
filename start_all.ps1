# Script to start ngrok, Django backend, and Next.js frontend
# For ReadyRent.Gala project

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ReadyRent.Gala - Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Store current directory
$ProjectRoot = Get-Location

# Check if ngrok is installed
$ngrokInstalled = $false
try {
    $null = ngrok version 2>&1
    $ngrokInstalled = $true
    Write-Host "✅ ngrok is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  ngrok is not installed" -ForegroundColor Yellow
    Write-Host "   Install from: https://ngrok.com/download" -ForegroundColor Gray
}

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed!" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start Django Backend
Write-Host "1. Starting Django Backend..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "python" -ArgumentList "manage.py", "runserver", "8000" -WorkingDirectory "$ProjectRoot\backend" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3
if ($backendProcess -and -not $backendProcess.HasExited) {
    Write-Host "   ✅ Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend may have issues starting" -ForegroundColor Yellow
}

# Start Next.js Frontend
Write-Host "2. Starting Next.js Frontend..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$ProjectRoot\frontend" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3
if ($frontendProcess -and -not $frontendProcess.HasExited) {
    Write-Host "   ✅ Frontend started (PID: $($frontendProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend may have issues starting" -ForegroundColor Yellow
}

# Start ngrok if installed
$ngrokProcess = $null
if ($ngrokInstalled) {
    Write-Host "3. Starting ngrok tunnel..." -ForegroundColor Yellow
    $ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http", "8000" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 4
    
    # Try to get ngrok URL
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET -ErrorAction Stop
        if ($ngrokApi.tunnels.Count -gt 0) {
            $publicUrl = $ngrokApi.tunnels[0].public_url
            Write-Host "   ✅ ngrok tunnel active!" -ForegroundColor Green
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "  Services are running!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Backend (Local):    http://localhost:8000" -ForegroundColor Yellow
            Write-Host "Frontend (Local):    http://localhost:3000" -ForegroundColor Yellow
            Write-Host "ngrok (Public):      $publicUrl" -ForegroundColor Green
            Write-Host ""
            Write-Host "Webhook URLs:" -ForegroundColor Cyan
            Write-Host "  BaridiMob:  $publicUrl/api/payments/webhooks/baridimob/" -ForegroundColor Yellow
            Write-Host "  Bank Card:  $publicUrl/api/payments/webhooks/bank-card/" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Update .env with:" -ForegroundColor Cyan
            Write-Host "  BACKEND_URL=$publicUrl" -ForegroundColor Yellow
            Write-Host "  FRONTEND_URL=$publicUrl" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  ngrok started but URL not available yet" -ForegroundColor Yellow
        Write-Host "   Check: http://localhost:4040" -ForegroundColor Gray
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Services are running!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Backend:  http://localhost:8000" -ForegroundColor Yellow
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
        Write-Host "ngrok UI:  http://localhost:4040" -ForegroundColor Yellow
    }
} else {
    Write-Host "3. Skipping ngrok (not installed)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Services are running!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Backend:  http://localhost:8000" -ForegroundColor Yellow
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Gray

# Wait for Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($ngrokProcess -and -not $ngrokProcess.HasExited) {
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "All services stopped." -ForegroundColor Green
}
