
import os
import sys
import subprocess

def run_security_check():
    print("🏰 [FORTRESS CHECK] Initiating Sovereign Security Audit...")
    
    # Set Production Environment Variables
    env = os.environ.copy()
    env['DEBUG'] = 'False'
    env['SECRET_KEY'] = 'sovereign-production-key-very-secret-and-long-random-string'
    env['SECURE_SSL_REDIRECT'] = 'True'
    env['SESSION_COOKIE_SECURE'] = 'True'
    env['CSRF_COOKIE_SECURE'] = 'True'
    env['SECURE_HSTS_SECONDS'] = '31536000' # 1 Year
    env['SECURE_HSTS_INCLUDE_SUBDOMAINS'] = 'True'
    env['SECURE_HSTS_PRELOAD'] = 'True'
    # env['ALLOWED_HOSTS'] = 'standard.rent,www.standard.rent' # Strict hosts

    print(f"🔒 [ENV] DEBUG={env['DEBUG']}")
    print(f"🔒 [ENV] SECURE_SSL_REDIRECT={env['SECURE_SSL_REDIRECT']}")

    # Run check --deploy
    try:
        result = subprocess.run(
            [sys.executable, 'manage.py', 'check', '--deploy'],
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            env=env,
            capture_output=True,
            text=True
        )
        
        output = result.stdout + result.stderr
        
        # Filter out DRF Spectacular warnings (Noise)
        filtered_output = []
        warnings_count = 0
        security_warnings = 0
        
        for line in output.splitlines():
            if "(drf_spectacular" in line or "TensorFlow" in line or "oneDNN" in line:
                continue
            if "(security." in line:
                security_warnings += 1
                filtered_output.append(f"❌ {line}")
            elif "System check identified" in line:
                filtered_output.append(f"ℹ️ {line}")
            else:
                filtered_output.append(line)

        print("\n".join(filtered_output))

        if security_warnings == 0:
            print("\n✅ [FORTRESS VERIFIED] No Security Vulnerabilities Detected.")
            return True
        else:
            print(f"\n⚠️ [FORTRESS BREACH] {security_warnings} Security Warnings Detected.")
            return False

    except Exception as e:
        print(f"💥 [ERROR] Failed to run audit: {e}")
        return False

if __name__ == "__main__":
    success = run_security_check()
    sys.exit(0 if success else 1)
