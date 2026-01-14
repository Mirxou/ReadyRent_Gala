@echo off
REM Setup script for development environment
REM This script helps set up the development environment

echo ========================================
echo ReadyRent.Gala - Development Setup
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing requirements...
pip install -r requirements.txt

echo.
echo ========================================
echo Setup completed!
echo ========================================
echo.
echo Next steps:
echo 1. Update backend/.env with your actual values
echo 2. Run: python manage.py makemigrations
echo 3. Run: python manage.py migrate
echo 4. Run: python manage.py create_demo_admin
echo 5. Run: python manage.py seed_data
echo.
pause

