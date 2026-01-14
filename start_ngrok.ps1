# Script to start ngrok tunnel for ReadyRent.Gala
# Make sure ngrok is installed: https://ngrok.com/download

Write-Host "Starting ngrok tunnel for Django backend..." -ForegroundColor Cyan

# Default Django port
$DjangoPort = 8000

# Check if ngrok is installed
try {
    $ngrokVersion = ngrok version 2>&1
    Write-Host "ngrok found!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: ngrok is not installed!" -ForegroundColor Red
    Write-Host "Please install ngrok from: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "Or use: choco install ngrok (if you have Chocolatey)" -ForegroundColor Yellow
    exit 1
}

# Check if Django is running
Write-Host "Checking if Django is running on port $DjangoPort..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$DjangoPort/api/health/" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "Django is running!" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Django doesn't seem to be running on port $DjangoPort" -ForegroundColor Yellow
    Write-Host "Please start Django first with: python manage.py runserver" -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Yellow
}

# Start ngrok
Write-Host "`nStarting ngrok tunnel..." -ForegroundColor Cyan
Write-Host "Public URL will be displayed below:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Start ngrok in background and capture output
$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http", $DjangoPort -NoNewWindow -PassThru -RedirectStandardOutput "ngrok_output.txt" -RedirectStandardError "ngrok_error.txt"

# Wait a bit for ngrok to start
Start-Sleep -Seconds 3

# Try to get ngrok API URL (if ngrok web interface is enabled)
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET -ErrorAction Stop
    if ($ngrokApi.tunnels.Count -gt 0) {
        $publicUrl = $ngrokApi.tunnels[0].public_url
        Write-Host "`n✅ ngrok tunnel is active!" -ForegroundColor Green
        Write-Host "Public URL: $publicUrl" -ForegroundColor Green
        Write-Host "`nWebhook URLs:" -ForegroundColor Cyan
        Write-Host "  BaridiMob: $publicUrl/api/payments/webhooks/baridimob/" -ForegroundColor Yellow
        Write-Host "  Bank Card: $publicUrl/api/payments/webhooks/bank-card/" -ForegroundColor Yellow
        Write-Host "`nUpdate your .env file with:" -ForegroundColor Cyan
        Write-Host "  BACKEND_URL=$publicUrl" -ForegroundColor Yellow
        Write-Host "  FRONTEND_URL=$publicUrl" -ForegroundColor Yellow
        Write-Host "`nPress Ctrl+C to stop ngrok" -ForegroundColor Gray
    }
} catch {
    Write-Host "`n⚠️  Could not get ngrok URL automatically" -ForegroundColor Yellow
    Write-Host "Check ngrok web interface at: http://localhost:4040" -ForegroundColor Cyan
    Write-Host "Or check the output files: ngrok_output.txt" -ForegroundColor Cyan
}

# Keep script running
Write-Host "`nngrok is running. Press Ctrl+C to stop..." -ForegroundColor Gray
try {
    $ngrokProcess.WaitForExit()
} catch {
    Write-Host "`nStopping ngrok..." -ForegroundColor Yellow
    Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
}
