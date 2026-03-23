import psycopg2
import sys
import socket

PROJECT_REF = "mwmpdpwjokdwcnifopxs"
PASSWORD = "seEPrX8FLcfNdUMs"

configs = [
    {
        "name": "Direct IPv6 (Bypassing DNS)",
        "host": "2a05:d014:1c06:5f39:56c6:e5a7:94b4:22e1",
        "user": "postgres",
        "port": "5432",
        "dbname": "postgres"
    },
    {
        "name": "Supavisor Domain (Transaction Pooler)",
        "host": f"supavisor.{PROJECT_REF}.supabase.co",
        "user": f"postgres.{PROJECT_REF}",
        "port": "6543",
        "dbname": "postgres"
    }
]

print(f"🔍 Testing connections for project: {PROJECT_REF}\n")

for config in configs:
    print(f"Testing: {config['name']}...")
    print(f"  Host: {config['host']}")
    print(f"  Port: {config['port']}")
    
    try:
        conn = psycopg2.connect(
            host=config['host'],
            database=config['dbname'],
            user=config['user'],
            password=PASSWORD,
            port=config['port']
        )
        print("  ✅ CONNECTION SUCCESSFUL!")
        conn.close()
        break 
    except Exception as e:
        print(f"  ❌ Failed: {e}")
    print("-" * 40)
