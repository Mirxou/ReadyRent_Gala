import threading
import sys
import traceback
import time
import os

def dump_tracebacks():
    time.sleep(25)
    with open('pytest_hang_dump.txt', 'w') as f:
        f.write("DUMPING TRACEBACKS:\\n")
        sys._current_frames()
        for thread_id, frame in sys._current_frames().items():
            f.write(f"\\n--- Thread {thread_id} ---\\n")
            traceback.print_stack(frame, file=f)
        f.write("DUMP COMPLETE\\n")
    os._exit(1)

threading.Thread(target=dump_tracebacks, daemon=True).start()

import pytest
sys.argv = ["pytest", "tests/constitutional/test_sovereign_compliance.py", "-s"]
pytest.main()
