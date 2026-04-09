import os
import sys

# Test basic DRF import
try:
    from rest_framework.permissions import AllowAny
    print(f"Basic DRF AllowAny: {AllowAny}")
except Exception as e:
    print(f"Basic DRF Error: {e}")

# Test direct view import
sys.path.append(os.getcwd())
try:
    # Try to import just the permissions from DRF to see if it works in our context
    import rest_framework.permissions
    print(f"rest_framework.permissions has AllowAny: {hasattr(rest_framework.permissions, 'AllowAny')}")
    
    # Check if we can see the bundles views.py as a text file to check for hidden characters
    with open('apps/bundles/views.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        print(f"Line 4 content: {repr(lines[3])}")
        print(f"Line 37 content: {repr(lines[36])}")
except Exception as e:
    print(f"Diagnostic Error: {e}")
