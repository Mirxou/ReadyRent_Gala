import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'db.sqlite3')
print(f"Connecting to database at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- TABLES ---")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for t in tables:
        print(t[0])
    print("--- END TABLES ---")

    # Check for likely user tables
    potential_tables = ['auth_user', 'users_user', 'core_user']
    for table in potential_tables:
        try:
            cursor.execute(f"SELECT count(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"Table '{table}' exists with {count} rows.")
            
            # If exists, print columns
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [info[1] for info in cursor.fetchall()]
            print(f"Columns in {table}: {columns}")
            
            # Dump users if found
            print(f"--- DATA FROM {table} ---")
            # Try to select common fields
            try:
                cursor.execute(f"SELECT id, email, username, is_staff FROM {table}")
                users = cursor.fetchall()
                for u in users:
                    print(f"ID: {u[0]} | Email: {u[1]} | Name: {u[2]} | Staff: {u[3]}")
            except:
                # Fallback to select *
                cursor.execute(f"SELECT * FROM {table} LIMIT 5")
                rows = cursor.fetchall()
                for row in rows:
                    print(row)

        except Exception as e:
            print(f"Table '{table}' query failed: {e}")

except Exception as e:
    print(f"Database connection failed: {e}")
