@echo off

c:\Users\aboun\Desktop\ReadyRent_Gala\backend\venv\Scripts\python.exe -m pytest tests/unit/test_availability_service.py tests/unit/test_bookings_services.py tests/unit/test_models_coverage.py tests/integration/test_advanced_flows.py tests/security/test_advanced_security.py -v --cov=apps --cov-report=html --cov-report=term-missing

pause