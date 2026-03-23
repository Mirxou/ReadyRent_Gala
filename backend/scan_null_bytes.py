import os

def scan_for_null_bytes(start_dir):
    print(f"Scanning {start_dir} for null bytes in .py files...")
    corrupted_files = []
    
    for root, dirs, files in os.walk(start_dir):
        if "venv" in root or "__pycache__" in root:
            continue
            
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                try:
                    with open(path, "rb") as f:
                        content = f.read()
                        if b'\x00' in content:
                            print(f"❌ CORRUPTED: {path}")
                            corrupted_files.append(path)
                except Exception as e:
                    print(f"⚠️ Error reading {path}: {e}")

    if corrupted_files:
        print(f"\nFound {len(corrupted_files)} corrupted files.")
    else:
        print("\n✅ No null bytes found in scanned files.")

if __name__ == "__main__":
    scan_for_null_bytes(os.getcwd())
