@echo off
REM Setup script for frontend development environment
REM This script helps set up the frontend development environment

echo ========================================
echo ReadyRent.Gala Frontend - Setup
echo ========================================
echo.

echo Installing dependencies...
call npm install

echo.
echo ========================================
echo Setup completed!
echo ========================================
echo.
echo Next steps:
echo 1. Update frontend/.env.local with your actual values
echo 2. Run: npm run dev
echo.
pause

