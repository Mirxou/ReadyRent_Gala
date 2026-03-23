import os
import sys
import django

print("--- Diagnostic Start ---")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
try:
    django.setup()
    print("Django setup() complete.")
    from config.wsgi import application
    print("WSGI application loaded successfully.")
except Exception as e:
    import traceback
    print("Error during WSGI loading:")
    traceback.print_exc()
print("--- Diagnostic End ---")
