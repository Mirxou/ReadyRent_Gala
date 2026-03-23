import psycopg2
import sys

PROJECT_REF = "mwmpdpwjokdwcnifopxs"
PASSWORD = "seEPrX8FLcfNdUMs"  # Caution: Hardcoded for local test only
USER = f"postgres.{PROJECT_REF}"

# List of common Supabase Pooler Regions
regions = [
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-us-west-1.pooler.supabase.com",
    "aws-0-eu-central-1.pooler.supabase.com", # Already failed, but keeping for completeness
    "aws-0-eu-west-1.pooler.supabase.com",
    "aws-0-eu-west-2.pooler.supabase.com",
    "aws-0-eu-west-3.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com",
    "aws-0-ap-northeast-1.pooler.supabase.com",
    "aws-0-sa-east-1.pooler.supabase.com",
    "aws-0-ca-central-1.pooler.supabase.com",
    "aws-0-ap-south-1.pooler.supabase.com",
]

print(f"🌍 Starting Region Scan for Project: {PROJECT_REF}")
print("Trying to find the correct IPv4 Pooler...\n")

success_host = None

for host in regions:
    print(f"👉 Testing Region Host: {host}...")
    try:
        # Try a quick connection
        conn = psycopg2.connect(
            host=host,
            database="postgres",
            user=USER,
            password=PASSWORD,
            port="6543",
            connect_timeout=3
        )
        print(f"  🎉 SUCCESS! Found correct region: {host}")
        success_host = host
        conn.close()
        break
    except psycopg2.OperationalError as e:
        msg = str(e).strip()
        if "Tenant or user not found" in msg:
            print("  ❌ Wrong Region (Tenant not found)")
        elif "timeout" in msg:
             print("  ⚠️ Timeout (Network/Firewall)")
        else:
            print(f"  ❌ Error: {msg.splitlines()[0]}")
    except Exception as e:
        print(f"  ❌ Failed: {e}")
    print("-" * 20)

if success_host:
    print(f"\n✅ YOUR CORRECT HOST IS: {success_host}")
    print("Please use this host in your .env file.")
else:
    print("\n❌ Could not auto-detect region. Please check Supabase Dashboard settings manually.")
