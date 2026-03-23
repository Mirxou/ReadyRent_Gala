import psycopg2
import sys

try:
    print("Connecting to 127.0.0.1:5432...", file=sys.stderr)
    conn = psycopg2.connect(
        dbname="standard_rent",
        user="postgres",
        password="postgres",
        host="127.0.0.1",
        port="5432"
    )
    print("SUCCESS")
    conn.close()
except Exception as e:
    print(f"FAILED: {e}")
