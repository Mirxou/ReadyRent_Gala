
import os
import time
import environ

print("1. Initializing environ.Env...")
try:
    start_time = time.time()
    env = environ.Env(DEBUG=(bool, False))
    print(f"2. environ.Env initialized in {time.time() - start_time:.2f} seconds.")
except Exception as e:
    print(f"❌ Error during Env init: {e}")

print("3. Reading .env file...")
try:
    start_time = time.time()
    environ.Env.read_env(".env")
    print(f"4. .env file read in {time.time() - start_time:.2f} seconds.")
except Exception as e:
    print(f"❌ Error during read_env: {e}")
