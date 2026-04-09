@echo off
echo Setting execution policy...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process"

echo.
echo === BACKEND TESTS ===
cd "c:\Users\aboun\Desktop\ReadyRent_Gala\backend"
echo Running backend tests...
python -m pytest tests/unit/test_payments_serializers.py -v --tb=short
if %errorlevel% neq 0 (
    echo Backend tests failed!
    pause
    exit /b 1
)

echo.
echo === FRONTEND UNIT TESTS ===
cd "c:\Users\aboun\Desktop\ReadyRent_Gala\frontend"
echo Running frontend unit tests...
call npm run test -- --watchAll=false --verbose
if %errorlevel% neq 0 (
    echo Frontend unit tests failed!
    pause
    exit /b 1
)

echo.
echo === FRONTEND E2E TESTS ===
echo Running frontend E2E tests...
call npm run test:e2e
if %errorlevel% neq 0 (
    echo Frontend E2E tests failed!
    pause
    exit /b 1
)

echo.
echo All tests completed successfully!
pause