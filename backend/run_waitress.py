"""
Run waitress production WSGI server
"""
from waitress import serve
from config.wsgi import application

if __name__ == '__main__':
    print("=" * 70)
    print("Starting Waitress Production Server")
    print("=" * 70)
    print("Host: 127.0.0.1:8000")
    print("Threads: 4")
    print("=" * 70)
    serve(application, host='127.0.0.1', port=8000, threads=4)
