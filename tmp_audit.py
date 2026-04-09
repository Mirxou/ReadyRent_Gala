import os
import json
from collections import defaultdict

def scan_dir(path):
    stats = {
        'total_files': 0,
        'total_size': 0,
        'ext_counts': defaultdict(int),
        'secret_files': [],
        'categories': {
            'source': 0, 'components': 0, 'tests': 0, 'config': 0, 'scripts': 0
        }
    }
    
    for root, dirs, files in os.walk(path):
        if 'node_modules' in root or '.git' in root or '__pycache__' in root or '.next' in root or 'venv' in root:
            continue
            
        for f in files:
            fp = os.path.join(root, f)
            try:
                size = os.path.getsize(fp)
                stats['total_size'] += size
                stats['total_files'] += 1
                ext = f.split('.')[-1] if '.' in f else 'none'
                stats['ext_counts'][ext] += 1
                
                # Secret detection
                if '.env' in f or f.endswith('.pem') or f.endswith('.key'):
                    stats['secret_files'].append(fp.replace(path, ''))
                
                # Categories
                if 'components' in fp or 'templates' in fp:
                    stats['categories']['components'] += 1
                elif 'test' in fp.lower() or 'spec' in fp.lower() or 'mock' in fp.lower():
                    stats['categories']['tests'] += 1
                elif f.endswith('.json') or f.endswith('.yml') or f.endswith('.ini') or f.endswith('.toml'):
                    stats['categories']['config'] += 1
                elif 'scripts' in fp or f.endswith('.sh') or f.endswith('.bat') or f.endswith('.ps1'):
                    stats['categories']['scripts'] += 1
                elif f.endswith('.py') or f.endswith('.ts') or f.endswith('.tsx') or f.endswith('.js'):
                    stats['categories']['source'] += 1
                    
            except Exception:
                pass
                
    # convert default dict
    stats['ext_counts'] = dict(stats['ext_counts'])
    stats['total_size_mb'] = round(stats['total_size'] / (1024 * 1024), 2)
    return stats

backend_stats = scan_dir('C:/Users/aboun/Desktop/ReadyRent_Gala/backend')
frontend_stats = scan_dir('C:/Users/aboun/Desktop/ReadyRent_Gala/frontend')

print(json.dumps({
    'backend': backend_stats,
    'frontend': frontend_stats
}, indent=2))
