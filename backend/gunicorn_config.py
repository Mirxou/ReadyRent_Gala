import multiprocessing
import os

# Gunicorn configuration for ReadyRent.Gala (Production Mode)

# Bind to all interfaces on port 8000
bind = "0.0.0.0:8000"

# Performance Tuning
# rule of thumb: (2 x $num_cores) + 1
workers = 4  
threads = 2
worker_class = "gthread"

# Timeout and Keep-Alive
timeout = 60
keepalive = 5

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Logging
# Use "-" for stdout/stderr to be captured by Docker
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process Naming
proc_name = "gunicorn_readyrent"

# Hooks
def on_starting(server):
    print("🚀 Gunicorn Powering ReadyRent.Gala Backend...")

def worker_int(worker):
    worker.log.info("Worker interrupted.")

capture_output = True
enable_stdio_inheritance = True
max_requests = 1000
max_requests_jitter = 50
