$python = "C:\Users\aboun\Desktop\ReadyRent_Gala\backend\venv\Scripts\python.exe"
$log = "C:\Users\aboun\Desktop\ReadyRent_Gala\backend\pytest_capture.txt"
& $python -m pytest tests/unit/test_payments_serializers.py -q -s --disable-warnings *> $log 2>&1
Write-Output "RUN COMPLETE"
