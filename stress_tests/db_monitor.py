"""
Database Monitor for Stress Tests
===================================
Runs alongside Locust to monitor PostgreSQL health metrics.

USAGE (in a separate terminal while Locust is running):
  cd backend
  python -m stress_tests.db_monitor

MONITORS:
  - Active connections
  - Slow queries (> 500ms)
  - Locking / blocking queries
  - Table sizes (EvidenceLog growth)
  - Cache hit ratio (should be > 99% for reads)

REQUIREMENTS:
  - PostgreSQL (pg_stat_activity, pg_stat_user_tables)
  - psycopg2 or psycopg installed
  - Django ORM available (run from backend/ with manage.py shell)
"""

import time
import sys
import os

# Bootstrap Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from django.db import connection

SLOW_QUERY_THRESHOLD_MS = 500
MONITOR_INTERVAL_SECONDS = 5


def get_active_connections():
    """All active PostgreSQL connections."""
    with connection.cursor() as cur:
        cur.execute("""
            SELECT count(*) as total,
                   sum(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,
                   sum(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle,
                   sum(CASE WHEN wait_event_type = 'Lock' THEN 1 ELSE 0 END) as locked
            FROM pg_stat_activity
            WHERE datname = current_database();
        """)
        row = cur.fetchone()
        return {
            "total": row[0],
            "active": row[1],
            "idle": row[2],
            "locked": row[3],
        }


def get_slow_queries():
    """Queries running longer than the threshold."""
    with connection.cursor() as cur:
        cur.execute(f"""
            SELECT pid, now() - query_start AS duration, query, wait_event_type
            FROM pg_stat_activity
            WHERE state = 'active'
              AND query_start IS NOT NULL
              AND now() - query_start > INTERVAL '{SLOW_QUERY_THRESHOLD_MS} milliseconds'
              AND datname = current_database()
            ORDER BY duration DESC
            LIMIT 5;
        """)
        rows = cur.fetchall()
        return [
            {
                "pid": row[0],
                "duration": str(row[1]),
                "query": row[2][:120],
                "wait": row[3],
            }
            for row in rows
        ]


def get_lock_contention():
    """Queries blocked by locks."""
    with connection.cursor() as cur:
        cur.execute("""
            SELECT blocked_locks.pid AS blocked_pid,
                   blocking_locks.pid AS blocking_pid,
                   blocked_activity.query AS blocked_query,
                   blocking_activity.query AS blocking_query
            FROM pg_catalog.pg_locks blocked_locks
            JOIN pg_catalog.pg_stat_activity blocked_activity
                ON blocked_activity.pid = blocked_locks.pid
            JOIN pg_catalog.pg_locks blocking_locks
                ON blocking_locks.locktype = blocked_locks.locktype
                AND blocking_locks.granted = true
                AND blocked_locks.granted = false
            JOIN pg_catalog.pg_stat_activity blocking_activity
                ON blocking_activity.pid = blocking_locks.pid
            LIMIT 5;
        """)
        rows = cur.fetchall()
        return [
            {
                "blocked_pid": row[0],
                "blocking_pid": row[1],
                "blocked_query": str(row[2])[:80],
                "blocking_query": str(row[3])[:80],
            }
            for row in rows
        ]


def get_evidence_log_count():
    """How many EvidenceLog entries exist (chain growth rate)."""
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM disputes_evidencelog;")
            return cur.fetchone()[0]
    except Exception:
        return "N/A"


def get_cache_hit_ratio():
    """Read cache hit ratio for the entire database (should be > 99%)."""
    with connection.cursor() as cur:
        cur.execute("""
            SELECT
                round(
                    sum(heap_blks_hit) * 100.0 /
                    NULLIF(sum(heap_blks_hit + heap_blks_read), 0),
                    2
                ) AS cache_hit_ratio
            FROM pg_statio_user_tables;
        """)
        row = cur.fetchone()
        return row[0] if row else "N/A"


def monitor_loop():
    print("\n" + "=" * 70)
    print(" 🔬 STANDARD.Rent — DB Monitor for Phase 24 Stress Test")
    print(" Press Ctrl+C to stop.")
    print("=" * 70 + "\n")

    while True:
        try:
            conns = get_active_connections()
            slow = get_slow_queries()
            locks = get_lock_contention()
            evidence_count = get_evidence_log_count()
            cache_ratio = get_cache_hit_ratio()

            print(f"[{time.strftime('%H:%M:%S')}]")
            print(
                f"  Connections → Total: {conns['total']} | Active: {conns['active']} | "
                f"Idle: {conns['idle']} | Locked: {conns['locked']}"
            )
            print(f"  EvidenceLog entries: {evidence_count}")
            print(f"  DB Cache Hit Ratio: {cache_ratio}%")

            if slow:
                print(f"  ⚠  Slow Queries ({len(slow)}):")
                for q in slow:
                    print(f"     PID {q['pid']} ({q['duration']}) — {q['query']}...")
            else:
                print("  ✅ No slow queries.")

            if locks:
                print(f"  🔒 Lock Contention ({len(locks)}):")
                for lock in locks:
                    print(
                        f"     PID {lock['blocked_pid']} blocked by {lock['blocking_pid']}"
                    )
            else:
                print("  ✅ No lock contention.")

            print()
        except KeyboardInterrupt:
            print("\n[DB Monitor] Stopped.")
            break
        except Exception as e:
            print(f"  [DB Monitor Error] {e}")

        time.sleep(MONITOR_INTERVAL_SECONDS)


if __name__ == "__main__":
    monitor_loop()
