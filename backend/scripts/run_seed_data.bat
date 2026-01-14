@echo off
REM Script to run seed_data command
REM This script runs the seed_data management command

echo ========================================
echo Running Seed Data Command
echo ========================================
echo.

REM Activate virtual environment if exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo Running seed_data command...
python manage.py seed_data

echo.
echo ========================================
echo Seed data completed!
echo ========================================
echo.
pause

