import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())

print(f"sys.path: {sys.path}")
print("Attempting to import apps.users.urls...")

try:
    import apps.users.urls
    print("SUCCESS: apps.users.urls imported.")
except ImportError as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"FAILURE (Exception): {e}")
    import traceback
    traceback.print_exc()
