import sys
import os

print("Setting up env...")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.test_settings')

print("Importing django...")
import django

print("Running django.setup()...")
# we can trace django.setup() by replacing apps.populate with a printing version
from django.apps import apps
original_populate = apps.populate

def new_populate(installed_apps=None):
    from django.utils.module_loading import import_string
    print("Populating apps...")
    if not apps.apps_ready:
        for app_config in apps.get_app_configs():
            print(f"App config: {app_config.name}")
    original_populate(installed_apps)
    print("Populate done.")

print("Calling setup")
try:
    django.setup()
    print("Setup done!")
except Exception as e:
    import traceback
    traceback.print_exc()

print("Checking models ready...")
