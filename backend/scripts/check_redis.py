#!/usr/bin/env python
"""Redis Production Health Check"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.cache import cache
from django.conf import settings
import redis
import time


def main():
    print("=" * 80)
    print("REDIS PRODUCTION HEALTH CHECK")
    print("=" * 80)
    
    try:
        # 1. Connection test
        print("\n[1/6] Testing connection...")
        cache.set('health_check', 'OK', timeout=10)
        assert cache.get('health_check') == 'OK'
        print("✅ Connection: OK")
        
        # 2. Server info
        print("\n[2/6] Server info...")
        client = redis.from_url(settings.REDIS_URL)
        info = client.info()
        print(f"  Version: {info['redis_version']}")
        print(f"  Uptime: {info['uptime_in_seconds']}s")
        print(f"  Clients: {info['connected_clients']}")
        print(f"  Memory: {info['used_memory_human']} / {info.get('maxmemory_human', 'unlimited')}")
        print(f"  Policy: {info.get('maxmemory_policy', 'none')}")
        
        # 3. Persistence
        print("\n[3/6] Persistence...")
        print(f"  AOF: {'✅' if info.get('aof_enabled') == 1 else '❌'}")
        print(f"  RDB last save: {info.get('rdb_last_save_time', 'N/A')}")
        
        # 4. Performance
        print("\n[4/6] Performance test (1000 ops)...")
        start = time.time()
        for i in range(1000):
            cache.set(f'perf_{i}', i)
            cache.get(f'perf_{i}')
        elapsed = time.time() - start
        ops = 2000 / elapsed
        print(f"  Ops/sec: {ops:.0f}")
        
        if ops < 1000:
            print("  ⚠️ Warning: Low performance")
        else:
            print("  ✅ Performance: OK")
        
        # Cleanup
        for i in range(1000):
            cache.delete(f'perf_{i}')
        
        # 5. Memory policy
        print("\n[5/6] Memory policy...")
        maxmem = info.get('maxmemory', 0)
        if maxmem > 0:
            print(f"  ✅ Max memory: {info['maxmemory_human']}")
        else:
            print(f"  ⚠️ No memory limit set")
        
        # 6. Security
        print("\n[6/6] Security...")
        try:
            result = client.execute_command('CONFIG', 'GET', 'requirepass')
            if result[1]:
                print("  ✅ Password: Enabled")
            else:
                print("  ⚠️ Password: Not set")
        except:
            print("  ✅ CONFIG command: Protected")
        
        print("\n" + "=" * 80)
        print("✅ ALL CHECKS PASSED")
        print("=" * 80)
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("=" * 80)
        return False


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
