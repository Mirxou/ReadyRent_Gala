@echo off
echo Running All Tests...

echo.
echo === BACKEND TESTS ===
cd "c:\Users\aboun\Desktop\ReadyRent_Gala\backend"
echo Running backend tests...
python -m pytest --cov=apps --cov-report=term-missing --cov-report=html --cov-report=json --tb=short -v
if %errorlevel% neq 0 (
    echo Backend tests failed!
    pause
    exit /b 1
)

echo.
echo === FRONTEND UNIT TESTS ===
cd "c:\Users\aboun\Desktop\ReadyRent_Gala\frontend"
echo Running frontend unit tests...
npm run test
if %errorlevel% neq 0 (
    echo Frontend unit tests failed!
    pause
    exit /b 1
)

echo.
echo === FRONTEND E2E TESTS ===
echo Running frontend E2E tests...
npm run test:e2e
if %errorlevel% neq 0 (
    echo Frontend E2E tests failed!
    pause
    exit /b 1
)

echo.
echo All tests completed successfully!
echo Check the following for results:
echo - Backend coverage: backend\htmlcov\index.html
echo - Frontend coverage: frontend\coverage\lcov-report\index.html
pause