@echo off
REM Script to run tests with coverage report (Windows)

echo Running Backend Tests with Coverage...

REM Activate virtual environment if exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Run tests with coverage
pytest --cov=apps --cov=config --cov=core --cov-report=html --cov-report=term --cov-report=xml --cov-fail-under=80 -v

echo.
echo Coverage report generated in htmlcov\index.html
echo Open htmlcov\index.html in your browser to view the detailed coverage report

pause

