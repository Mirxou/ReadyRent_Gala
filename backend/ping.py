from pathlib import Path
Path('ping_test.txt').write_text('OK', encoding='utf-8')
print('PING_DONE')
