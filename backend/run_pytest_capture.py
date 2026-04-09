import subprocess
from pathlib import Path

python_exe = Path(r"C:\Users\aboun\Desktop\ReadyRent_Gala\backend\venv\Scripts\python.exe")
output_file = Path(r"C:\Users\aboun\Desktop\ReadyRent_Gala\backend\pytest_capture.txt")

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
output_file.write_text(result.stdout + result.stderr, encoding="utf-8")
print("DONE", result.returncode)
