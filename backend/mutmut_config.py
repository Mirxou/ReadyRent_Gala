paths_to_mutate = [
    "apps/payments/engine.py",
]

tests_dir = [
    "apps/payments/tests",
]

runner = "venv\\Scripts\\pytest.exe -c pytest_mutmut.ini -q --disable-warnings"
