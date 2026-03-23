import os
import sys
import django
from django.db import connection

# Add project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def run():
    sql_path = r'c:\Users\pc\Desktop\ReadyRent_Gala\backend\database\supa_rls_setup.sql'
    print(f"Reading SQL from {sql_path}")
    
    if not os.path.exists(sql_path):
        print("SQL file not found!")
        return

    with open(sql_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    statements = sql_content.split(';')
    with connection.cursor() as cursor:
        for stmt in statements:
            stmt = stmt.strip()
            if not stmt: continue
            # Skip comments
            if stmt.startswith('--'): 
                continue
                
            try:
                print(f"Executing: {stmt[:50]}...")
                cursor.execute(stmt)
                print("OK")
            except Exception as e:
                print(f"FAILED: {e}")

if __name__ == '__main__':
    run()
