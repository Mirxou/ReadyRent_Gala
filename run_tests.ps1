#!/usr/bin/env powershell
# run_tests.ps1 - Unified test runner for ReadyRent
# Usage: ./run_tests.ps1 [backend|frontend|all]

param(
    [Parameter(Position=0)]
    [ValidateSet("backend", "frontend", "all", "coverage")]
    [string]$Target = "all"
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Header($text) {
    Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
}

function Write-Success($text) {
    Write-Host "✅ $text" -ForegroundColor Green
}

function Write-Error($text) {
    Write-Host "❌ $text" -ForegroundColor Red
}

# Run Backend Tests
function Run-BackendTests {
    Write-Header "BACKEND TESTS"
    
    $backendDir = Join-Path $rootDir "backend"
    Set-Location $backendDir
    
    # Check virtual environment
    $venvPython = Join-Path $backendDir "venv\Scripts\python.exe"
    if (-not (Test-Path $venvPython)) {
        Write-Error "Virtual environment not found. Run: python -m venv venv"
        exit 1
    }
    
    Write-Host "Running pytest with coverage..." -ForegroundColor Yellow
    & $venvPython -m pytest --tb=short -v
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend tests PASSED"
        $coverageReport = Join-Path $backendDir "htmlcov\index.html"
        if (Test-Path $coverageReport) {
            Write-Host "📊 Coverage report: $coverageReport" -ForegroundColor Gray
        }
    } else {
        Write-Error "Backend tests FAILED"
        exit 1
    }
}

# Run Frontend Tests
function Run-FrontendTests {
    Write-Header "FRONTEND TESTS"
    
    $frontendDir = Join-Path $rootDir "frontend"
    Set-Location $frontendDir
    
    # Check node_modules
    if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    Write-Host "Running Jest tests with coverage..." -ForegroundColor Yellow
    npm run test:coverage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend tests PASSED"
        $coverageReport = Join-Path $frontendDir "coverage\lcov-report\index.html"
        if (Test-Path $coverageReport) {
            Write-Host "📊 Coverage report: $coverageReport" -ForegroundColor Gray
        }
    } else {
        Write-Error "Frontend tests FAILED"
        exit 1
    }
}

# Run E2E Tests
function Run-E2ETests {
    Write-Header "E2E TESTS (Playwright)"
    
    $frontendDir = Join-Path $rootDir "frontend"
    Set-Location $frontendDir
    
    Write-Host "Running Playwright tests..." -ForegroundColor Yellow
    npm run test:e2e
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "E2E tests PASSED"
    } else {
        Write-Warning "E2E tests completed with issues (may require running server)"
    }
}

# Main
Write-Header "READYRENT TEST SUITE"

switch ($Target) {
    "backend" { 
        Run-BackendTests 
    }
    "frontend" { 
        Run-FrontendTests 
    }
    "coverage" {
        Run-BackendTests
        Run-FrontendTests
        Write-Header "COVERAGE SUMMARY"
        Write-Host "Backend: 75%+ required (configured in pytest.ini)"
        Write-Host "Frontend: 70%+ required (configured in jest.config.js)"
    }
    "all" {
        Run-BackendTests
        Run-FrontendTests
        # Run-E2ETests  # Uncomment when server is running
    }
}

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ ALL TESTS COMPLETED" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
