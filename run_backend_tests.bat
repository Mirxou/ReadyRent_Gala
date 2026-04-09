@echo off
echo Running Backend Tests with Coverage...
cd "c:\Users\aboun\Desktop\ReadyRent_Gala\backend"
python -m pytest --cov=apps --cov-report=term-missing --cov-report=html --cov-report=json --tb=short -v
echo Backend tests completed.
pause