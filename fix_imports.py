import os
import re

mappings = [
    # Feature specific (Most specific first)
    (r'@/components/sovereign/ecosystem-pulse', r'@/features/analytics/components/ecosystem-pulse'),
    (r'@/components/sovereign/high-court-monitor', r'@/features/judicial/components/high-court-monitor'),
    (r'@/components/sovereign/logistics-progress', r'@/features/logistics/components/logistics-progress'),
    
    # CamelCase to kebab-case
    (r'@/components/sovereign/SovereignSeal', r'@/shared/components/sovereign/sovereign-seal'),
    (r'@/components/sovereign/JusticeReceipt', r'@/shared/components/sovereign/justice-receipt'),
    (r'@/components/sovereign/DignifiedLoader', r'@/shared/components/sovereign/dignified-loader'),
    (r'@/components/sovereign/SystemHaltBanner', r'@/shared/components/sovereign/system-halt-banner'),
    (r'@/components/sovereign/ModeSwitcher', r'@/shared/components/sovereign/mode-switcher'),
    
    # Generic fallback
    (r'@/components/sovereign/', r'@/shared/components/sovereign/'),
]

def fix_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in mappings:
                    new_content = re.sub(old, new, new_content)
                
                if new_content != content:
                    print(f"Fixed imports in: {path}")
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

if __name__ == "__main__":
    app_dir = r"c:\Users\aboun\Desktop\ReadyRent_Gala\frontend\app"
    fix_imports(app_dir)
    
    # Also check layout and loading in root of app? os.walk covers it.
    print("Sovereign Import Cleanup Complete.")
