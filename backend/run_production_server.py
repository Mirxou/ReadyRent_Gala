import os
import sys
import logging
from pathlib import Path

# ---------------------------------------------------------------------------
# Sovereign Production Server Setup (Waitress / Windows)
# ---------------------------------------------------------------------------
# This script ensures robust, multi-threaded execution of the Django WSGI
# application. It sets up strict path resolution, configures banking-grade
# logging, and validates the environment before binding the socket.
# ---------------------------------------------------------------------------

# 1. Strict Path Resolution
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# 2. Banking-Grade Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('STANDARD.Rent.Boot')

def validate_environment() -> None:
    """Ensure critical environment variables are set before boot."""
    if not os.environ.get('DJANGO_SETTINGS_MODULE'):
        logger.warning("DJANGO_SETTINGS_MODULE not found in environment. Defaulting to 'config.settings'.")
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

def main() -> None:
    """Initialize WSGI and start the Waitress production server."""
    logger.info("Initializing Sovereign Production Environment...")
    validate_environment()

    try:
        # Late imports to ensure environment is fully loaded before Django loads
        from django.core.wsgi import get_wsgi_application  # type: ignore
        from waitress import serve  # type: ignore
    except ImportError as e:
        logger.critical(f"Critical Dependency Missing: {e}. Is the virtual environment active?")
        sys.exit(1)

    try:
        application = get_wsgi_application()
        logger.info("WSGI Application successfully loaded.")
    except Exception as exc:
        logger.critical(f"Fatal error during WSGI application initialization: {exc}")
        sys.exit(1)

    # Configuration extraction with safe defaults tailored for Windows
    port = int(os.environ.get("PORT", 8000))
    threads = int(os.environ.get("WAITRESS_THREADS", 16))
    connection_limit = int(os.environ.get("WAITRESS_CONNECTION_LIMIT", 2000))
    
    logger.info(f"Binding Waitress WSGI server to 0.0.0.0:{port}...")
    logger.info(f"Capacity Configuration: {threads} Threads | {connection_limit} Connection Limit")
    logger.info("Note: For Linux production environments (>10K CCU), migrate to Gunicorn + Uvicorn workers.")

    try:
        serve(
            application,
            host='0.0.0.0',
            port=port,
            threads=threads,
            connection_limit=connection_limit,
            channel_timeout=120,
            ident="STANDARD.Rent Server"
        )
    except KeyboardInterrupt:
        logger.info("Received shutdown signal. Gracefully exiting.")
        sys.exit(0)
    except Exception as exc:
        logger.critical(f"Server crashed unexpectedly: {exc}")
        sys.exit(1)

if __name__ == "__main__":
    main()
