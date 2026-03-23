import os
import sys
import django

# Set settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.test_settings')

print("DEBUG: Starting custom App Registry Tracer...", file=sys.stderr)

# Monkeypatch django.apps.registry.Apps.populate to see what's happening
from django.apps import apps

original_populate = apps.populate

def traced_populate(installed_apps):
    print(f"DEBUG: Populate called with {len(installed_apps)} apps.", file=sys.stderr)
    return original_populate(installed_apps)

apps.populate = traced_populate

# Monitor imports
import builtins
original_import = builtins.__import__

def traced_import(name, globals=None, locals=None, fromlist=(), level=0):
    if name.startswith('apps.'):
        print(f"DEBUG: Importing {name}...", file=sys.stderr)
    return original_import(name, globals, locals, fromlist, level)

builtins.__import__ = traced_import

try:
    print("DEBUG: Calling django.setup()...", file=sys.stderr)
    django.setup()
    print("DEBUG: django.setup() SUCCESS.", file=sys.stderr)
except Exception as e:
    print(f"DEBUG: django.setup() FAILED: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()

sys.exit(0)
