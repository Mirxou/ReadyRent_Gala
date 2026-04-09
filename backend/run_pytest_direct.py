import subprocess
from pathlib import Path

python_exe = Path(r"C:\Users\aboun\Desktop\ReadyRent_Gala\backend\venv\Scripts\python.exe")
backend_dir = Path(r"C:\Users\aboun\Desktop\ReadyRent_Gala\backend")
result = subprocess.run(
    [
        str(python_exe),
        "-m",
        "pytest",
        "tests/unit/test_availability_service.py",
        "tests/unit/test_bookings_services.py",
        "tests/unit/test_models_coverage.py",
        "tests/integration/test_advanced_flows.py",
        "tests/security/test_advanced_security.py",
        "-v",
        "--cov=apps",
        "--cov-report=html",
        "--cov-report=term-missing",
    ],
    cwd=str(backend_dir),
    capture_output=True,
    text=True,
)
print("RETURN_CODE", result.returncode)
print("STDOUT_START")
print(result.stdout)
print("STDOUT_END")
print("STDERR_START")
print(result.stderr)
print("STDERR_END")
