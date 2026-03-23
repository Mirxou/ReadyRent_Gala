"""
Gunicorn configuration for Sovereign Backend.
Optimized for 2GB RAM VPS (DigitalOcean Droplet / Hetzner Cloud).
"""
import multiprocessing

# Binding
bind = "127.0.0.1:8000"

# Workers (2 * CPUs + 1 is standard, but for 1 vCPU use 3)
workers = 3
worker_class = "gthread"  # Thread-based for better I/O handling (DB calls)
threads = 2

# Timeouts (Crucial for AI processing)
timeout = 120  # 2 minutes for slow AI models
keepalive = 5

# Logging
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"

# Process Naming
proc_name = "sovereign_backend"

# Reload (False in production)
reload = False

# Preload App (Faster startup, more memory efficient)
preload_app = True
