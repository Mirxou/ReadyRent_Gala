import os
import sys

def clean_file(file_path):
    print(f"Cleaning {file_path}...")
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        
        if b'\x00' not in content:
            print("No null bytes found. File is clean.")
            return

        cleaned_content = content.replace(b'\x00', b'')
        
        with open(file_path, "wb") as f:
            f.write(cleaned_content)
            
        print(f"cleaned {content.count(b'\x00')} null bytes.")
        print("File saved.")
    except Exception as e:
        print(f"Error cleaning file: {e}")

if __name__ == "__main__":
    target = os.path.join("apps", "users", "views.py")
    clean_file(target)
