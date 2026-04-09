import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.test_settings')
import django
django.setup()

import logging
logging.basicConfig(level=logging.DEBUG)

import time
start = time.time()
from django.core.management import call_command
call_command('migrate', '--run-syncdb', verbosity=3, interactive=False)
print(f"Migrate done in {time.time() - start} seconds")
