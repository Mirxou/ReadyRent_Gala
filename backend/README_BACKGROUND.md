# تشغيل Backend في الخلفية

## الطريقة الموصى بها (استخدام السكريبت)

### 1. تفعيل البيئة الافتراضية
```powershell
.\venv\Scripts\Activate.ps1
```

### 2. تشغيل Backend في الخلفية
```powershell
.\start_background.ps1
```

هذا السكريبت سيقوم بـ:
- ✅ التحقق من وجود virtual environment
- ✅ التحقق من تثبيت Django
- ✅ إيقاف أي عملية موجودة على المنفذ 8000
- ✅ تشغيل Django server في الخلفية
- ✅ حفظ Process ID (PID) في ملف
- ✅ حفظ الـ logs في `logs/backend_output.log` و `logs/backend_error.log`

### 3. إيقاف Backend
```powershell
.\stop_background.ps1
```

أو يدوياً باستخدام PID:
```powershell
$pid = Get-Content .\logs\backend.pid
Stop-Process -Id $pid -Force
```

---

## طرق أخرى

### الطريقة 2: استخدام Start-Job
```powershell
$job = Start-Job -ScriptBlock {
    cd C:\Users\pc\Desktop\ReadyRent_Gala\backend
    .\venv\Scripts\python.exe manage.py runserver 8000
}

# لعرض output
Receive-Job $job

# لإيقاف
Stop-Job $job
Remove-Job $job
```

### الطريقة 3: استخدام Start-Process مباشرة
```powershell
Start-Process -FilePath ".\venv\Scripts\python.exe" `
    -ArgumentList "manage.py","runserver","8000" `
    -WindowStyle Hidden `
    -RedirectStandardOutput ".\logs\output.log" `
    -RedirectStandardError ".\logs\error.log"
```

### الطريقة 4: باستخدام nohup (إذا كان متوفراً)
```powershell
# PowerShell doesn't have nohup natively, but you can use Start-Process
```

---

## التحقق من الحالة

### التحقق من أن Backend يعمل:
```powershell
# طريقة 1: التحقق من المنفذ
Get-NetTCPConnection -LocalPort 8000

# طريقة 2: HTTP request
Invoke-RestMethod -Uri "http://localhost:8000/api/health/"

# طريقة 3: التحقق من الـ logs
Get-Content .\logs\backend_output.log -Tail 20
```

### عرض جميع عمليات Python:
```powershell
Get-Process python
```

### إيقاف جميع عمليات Django:
```powershell
Get-Process python | Where-Object {
    $_.Path -like "*venv*"
} | Stop-Process -Force
```

---

## الملاحظات

- السكريبت يحفظ PID في `logs/backend.pid` للإيقاف السهل
- جميع الـ logs محفوظة في مجلد `logs/`
- إذا كان المنفذ 8000 مستخدماً، السكريبت سيحاول إيقاف العملية الموجودة
- يمكن تغيير المنفذ: `.\start_background.ps1 -Port 8080`

---

## الأخطاء الشائعة

### خطأ: "Virtual environment not found"
**الحل:** تأكد من وجود `venv` في مجلد `backend`:
```powershell
python -m venv venv
```

### خطأ: "Django not installed"
**الحل:** ثبّت Django:
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### خطأ: "Port already in use"
**الحل:** استخدم `stop_background.ps1` أولاً، أو:
```powershell
$process = Get-NetTCPConnection -LocalPort 8000
Stop-Process -Id $process.OwningProcess -Force
```
