@echo off
REM Script to run frontend tests with coverage report (Windows)

echo Running Frontend Tests with Coverage...

REM Run tests with coverage
npm run test:coverage

echo.
echo Coverage report generated in coverage\ directory
echo Open coverage\lcov-report\index.html in your browser to view the detailed coverage report

pause

