
import os
import ast
import pytest
from pathlib import Path

# Paths to check
APPS_DIR = Path(__file__).resolve().parent.parent.parent
PAYMENTS_APP_DIR = APPS_DIR / 'payments'

def is_valid_file_for_state_write(filepath):
    """
    Returns True if the file is allowed to write to EscrowHold.state.
    Only engine.py and migrations should do this.
    """
    path_str = str(filepath).replace(os.sep, '/')
    if 'migrations' in path_str:
        return True
    if 'tests' in path_str: # Tests might need to setup state
        return True
    if 'factories.py' in path_str: # Factories need to setup state
        return True
    if path_str.endswith('engine.py'):
        return True
    return False

def check_file_for_direct_assignment(filepath):
    """
    Parses a python file and asserts no direct assignments to 'state' or 'escrow_status'
    on what look like EscrowHold objects.
    This is a heuristic/grep check reinforced with AST where possible, 
    but for simplicity we'll start with text scanning as AST is complex for 'is this an EscrowHold object?'.
    
    Actually, let's stick to the high-confidence grep for specific strings that imply direct model writing.
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    lines = content.split('\n')
    for i, line in enumerate(lines):
        line = line.strip()
        # Check for bad patterns
        # We are looking for things like:
        # hold.state = ...
        # obj.escrow_status = ...
        
        # We want to catch: .state = 
        # But allow: .state == (comparison)
        
        if ".state =" in line and not ".state ==" in line:
            # exclude benign uses? 
            # hard to distinguish "self.state =" (React component?) vs "hold.state ="
            # So we rely on file allowlist.
            pass # Actually AST is better for this.
            
    # AST Approach
    try:
        tree = ast.parse(content)
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Attribute):
                        # Looking for obj.state = ...
                        if target.attr in ['state', 'escrow_status']:
                            # Found an assignment to 'state' or 'escrow_status'
                            # Check if file is allowed
                            if not is_valid_file_for_state_write(filepath):
                                pytest.fail(f"🚨 ARCHITECTURE VIOLATION: Direct assignment to '{target.attr}' detected in {filepath} line {node.lineno}. Use EscrowEngine.transition() instead.")
    except SyntaxError:
        pass # Ignore non-python files if any crept in

@pytest.mark.architecture
def test_no_direct_state_assignments():
    """
    Scans all python files in apps/payments to ensure no direct state assignments 
    occur outside of engine.py, migrations, and tests.
    """
    for root, dirs, files in os.walk(PAYMENTS_APP_DIR):
        for file in files:
            if file.endswith('.py'):
                full_path = Path(root) / file
                check_file_for_direct_assignment(full_path)
