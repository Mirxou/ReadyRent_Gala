"""
Django management command to check translation status
"""
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import translation
from django.utils.translation import gettext as _


class Command(BaseCommand):
    help = 'Check Django translation status'

    def handle(self, *args, **options):
        # #region agent log
        log_data = {
            'location': 'check_translations.py:handle',
            'message': 'Checking translation configuration',
            'data': {
                'LANGUAGE_CODE': settings.LANGUAGE_CODE,
                'USE_I18N': settings.USE_I18N,
                'LOCALE_PATHS': [str(p) for p in settings.LOCALE_PATHS],
            },
            'timestamp': __import__('time').time() * 1000,
            'sessionId': 'debug-session',
            'runId': 'check-translations',
            'hypothesisId': 'A'
        }
        try:
            import json
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_data, ensure_ascii=False) + '\n')
        except:
            pass
        # #endregion
        
        self.stdout.write(f"LANGUAGE_CODE: {settings.LANGUAGE_CODE}")
        self.stdout.write(f"USE_I18N: {settings.USE_I18N}")
        self.stdout.write(f"LOCALE_PATHS: {settings.LOCALE_PATHS}")
        
        # Check if translation files exist
        for locale_path in settings.LOCALE_PATHS:
            mo_file = os.path.join(locale_path, 'ar', 'LC_MESSAGES', 'django.mo')
            po_file = os.path.join(locale_path, 'ar', 'LC_MESSAGES', 'django.po')
            
            # #region agent log
            log_data = {
                'location': 'check_translations.py:handle',
                'message': 'Checking translation files',
                'data': {
                    'mo_file': mo_file,
                    'mo_exists': os.path.exists(mo_file),
                    'po_file': po_file,
                    'po_exists': os.path.exists(po_file),
                },
                'timestamp': __import__('time').time() * 1000,
                'sessionId': 'debug-session',
                'runId': 'check-translations',
                'hypothesisId': 'B'
            }
            try:
                import json
                with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                    f.write(json.dumps(log_data, ensure_ascii=False) + '\n')
            except:
                pass
            # #endregion
            
            self.stdout.write(f"\nChecking: {locale_path}")
            self.stdout.write(f"  django.mo exists: {os.path.exists(mo_file)}")
            self.stdout.write(f"  django.po exists: {os.path.exists(po_file)}")
            
            if os.path.exists(mo_file):
                size = os.path.getsize(mo_file)
                self.stdout.write(f"  django.mo size: {size} bytes")
        
        # Test translation
        translation.activate('ar')
        test_translation = _('Add')
        
        # #region agent log
        log_data = {
            'location': 'check_translations.py:handle',
            'message': 'Testing translation',
            'data': {
                'active_language': translation.get_language(),
                'test_string': 'Add',
                'translated': test_translation,
                'is_translated': test_translation != 'Add',
            },
            'timestamp': __import__('time').time() * 1000,
            'sessionId': 'debug-session',
            'runId': 'check-translations',
            'hypothesisId': 'C'
        }
        try:
            import json
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_data, ensure_ascii=False) + '\n')
        except:
            pass
        # #endregion
        
        self.stdout.write(f"\nActive language: {translation.get_language()}")
        self.stdout.write(f"Translation test ('Add'): {repr(test_translation)}")
        self.stdout.write(f"Is translated: {test_translation != 'Add'}")
