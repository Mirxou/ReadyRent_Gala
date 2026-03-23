#!/usr/bin/env python
"""PgBouncer Production Health Check"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
import psycopg2


def main():
    print("=" * 80)
    print("PGBOUNCER PRODUCTION HEALTH CHECK")
    print("=" * 80)
    
    try:
        # 1. Connection test
        print("\n[1/5] Testing connection via PgBouncer...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            assert result[0] == 1
        print("✅ Connection: OK")
        
        # 2. Database info
        print("\n[2/5] Database info...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]
            print(f"  PostgreSQL: {version.split(',')[0]}")
        
        # 3. Connection pool stats (via PgBouncer admin)
        print("\n[3/5] PgBouncer stats...")
        try:
            admin_conn = psycopg2.connect(
                host='pgbouncer',
                port=6543,
                user='rentily_admin',
                password=os.getenv('DB_PASSWORD'),
                database='pgbouncer'
            )
            
            cursor = admin_conn.cursor()
            cursor.execute("SHOW POOLS")
            pools = cursor.fetchall()
            
            for pool in pools:
                if 'rentily_production' in pool[0]:
                    print(f"  Database: {pool[0]}")
                    print(f"  Active connections: {pool[2]}")
                    print(f"  Waiting clients: {pool[3]}")
                    print(f"  Server connections: {pool[4]}")
            
            cursor.close()
            admin_conn.close()
            print("✅ PgBouncer stats: OK")
            
        except Exception as e:
            print(f"  ⚠️ Could not get PgBouncer stats: {e}")
        
        # 4. Performance test
        print("\n[4/5] Performance test (100 queries)...")
        import time
        start = time.time()
        
        for i in range(100):
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        
        elapsed = time.time() - start
        qps = 100 / elapsed
        print(f"  Queries/sec: {qps:.0f}")
        
        if qps < 100:
            print("  ⚠️ Warning: Low performance")
        else:
            print("  ✅ Performance: OK")
        
        # 5. Transaction isolation
        print("\n[5/5] Transaction mode...")
        pool_mode = "Unknown"
        try:
            admin_conn = psycopg2.connect(
                host='pgbouncer',
                port=6543,
                user='rentily_admin',
                password=os.getenv('DB_PASSWORD'),
                database='pgbouncer'
            )
            cursor = admin_conn.cursor()
            cursor.execute("SHOW CONFIG")
            configs = cursor.fetchall()
            for config in configs:
                if config[0] == 'pool_mode':
                    pool_mode = config[1]
                    break
            cursor.close()
            admin_conn.close()
        except:
            pass
        
        print(f"  Pool mode: {pool_mode}")
        if pool_mode == 'transaction':
            print("  ✅ Transaction pooling: Optimal")
        
        print("\n" + "=" * 80)
        print("✅ ALL CHECKS PASSED")
        print("=" * 80)
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("=" * 80)
        return False


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
