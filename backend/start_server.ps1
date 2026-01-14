# Script to start Django development server
Set-Location $PSScriptRoot

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Host "Virtual environment not found!" -ForegroundColor Red
    exit 1
}

# Start Django server
Write-Host "Starting Django development server on http://localhost:8000..." -ForegroundColor Green
python manage.py runserver 8000

