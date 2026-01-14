# Script to start Django Backend in background
# Run this from the backend directory

param(
    [int]$Port = 8000
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Django Backend (Background)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "   Please activate venv first:" -ForegroundColor Yellow
    Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
    exit 1
}

# Check if Django is installed
$pythonExe = Resolve-Path "venv\Scripts\python.exe"
try {
    $djangoVersion = & $pythonExe -c "import django; print(django.get_version())" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Django not installed"
    }
    Write-Host "✅ Django version: $djangoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Django not installed in virtual environment!" -ForegroundColor Red
    Write-Host "   Install with: pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# Stop any existing backend process on this port
$existingProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "⚠️  Port $Port is already in use. Stopping existing process..." -ForegroundColor Yellow
    Stop-Process -Id $existingProcess.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start Django server in background
Write-Host "🚀 Starting Django server on port $Port..." -ForegroundColor Cyan
Write-Host ""

$process = Start-Process -FilePath $pythonExe `
    -ArgumentList "manage.py", "runserver", "$Port" `
    -WorkingDirectory $PSScriptRoot `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput ".\logs\backend_output.log" `
    -RedirectStandardError ".\logs\backend_error.log" `
    -NoNewWindow

# Create logs directory if it doesn't exist
if (-not (Test-Path ".\logs")) {
    New-Item -ItemType Directory -Path ".\logs" -Force | Out-Null
}

Start-Sleep -Seconds 3

# Check if process is still running
if (-not $process.HasExited) {
    Write-Host "✅ Backend started successfully!" -ForegroundColor Green
    Write-Host "   Process ID: $($process.Id)" -ForegroundColor Gray
    Write-Host "   URL: http://localhost:$Port" -ForegroundColor Gray
    Write-Host "   Logs: .\logs\backend_output.log" -ForegroundColor Gray
    Write-Host "   Errors: .\logs\backend_error.log" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To stop the server:" -ForegroundColor Yellow
    Write-Host "   Stop-Process -Id $($process.Id) -Force" -ForegroundColor White
    Write-Host ""
    Write-Host "Or save the PID:" -ForegroundColor Yellow
    Write-Host "   `$pid = $($process.Id)" -ForegroundColor White
    Write-Host "   Stop-Process -Id `$pid -Force" -ForegroundColor White
    Write-Host ""
    
    # Save PID to file for easy stopping
    $process.Id | Out-File -FilePath ".\logs\backend.pid" -Encoding ASCII
    Write-Host "✅ PID saved to: .\logs\backend.pid" -ForegroundColor Green
    
    return $process.Id
} else {
    Write-Host "❌ Backend failed to start!" -ForegroundColor Red
    Write-Host "   Check logs for errors:" -ForegroundColor Yellow
    Write-Host "   Get-Content .\logs\backend_error.log" -ForegroundColor White
    exit 1
}
