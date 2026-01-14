@echo off
REM Script to create demo admin user
REM This script runs the create_demo_admin management command

echo ========================================
echo Creating Demo Admin User
echo ========================================
echo.

REM Activate virtual environment if exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo Running create_demo_admin command...
python manage.py create_demo_admin

echo.
echo ========================================
echo Admin user created!
echo ========================================
echo Default credentials:
echo Email: admin@readyrent.gala
echo Password: admin123
echo.
pause

