# Script to stop Django Backend running in background

Write-Host ""
Write-Host "Stopping Django Backend..." -ForegroundColor Cyan
Write-Host ""

# Try to read PID from file
$pidFile = ".\logs\backend.pid"
if (Test-Path $pidFile) {
    $pid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($pid) {
        Write-Host "Found PID: $pid" -ForegroundColor Gray
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "✅ Backend stopped successfully!" -ForegroundColor Green
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
            return
        } catch {
            Write-Host "⚠️  Process $pid not found or already stopped" -ForegroundColor Yellow
        }
    }
}

# Fallback: Find and stop by port 8000
$process = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($process) {
    $pid = $process.OwningProcess
    Write-Host "Found process on port 8000: $pid" -ForegroundColor Gray
    try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "✅ Backend stopped successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to stop process: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  No backend process found on port 8000" -ForegroundColor Yellow
}
