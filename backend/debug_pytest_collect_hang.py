import threading
import sys
import traceback
import time
import os

def dump_tracebacks():
    time.sleep(20)
    with open('pytest_hang_dump.txt', 'w') as f:
        f.write("DUMPING TRACEBACKS:\\n")
        for thread_id, frame in sys._current_frames().items():
            f.write(f"\\n--- Thread {thread_id} ---\\n")
            traceback.print_stack(frame, file=f)
        f.write("DUMP COMPLETE\\n")
    os._exit(1)

threading.Thread(target=dump_tracebacks, daemon=True).start()

import pytest
sys.argv = ["pytest", "tests/", "--collect-only"]
pytest.main()
