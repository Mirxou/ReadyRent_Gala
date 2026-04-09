from django.core.management.base import BaseCommand
from django.core.cache import cache
from ..models import SystemFlag

class Command(BaseCommand):
    help = 'The Sovereign Cancel Switch: Instantly halt or restore AI operations.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--on',
            action='store_true',
            help='Activates the HALT state (Stops AI)',
        )
        parser.add_argument(
            '--off',
            action='store_true',
            help='Deactivates the HALT state (Restores AI)',
        )

    def handle(self, *args, **options):
        from ..models import SystemFlag
        
        if options['on']:
            cache.set('SOVEREIGN_AI_HALTED', True, timeout=None)
            SystemFlag.set_flag('SOVEREIGN_AI_HALTED', True)
            self.stdout.write(self.style.ERROR('🚨 SOVEREIGN AI HAS BEEN HALTED. ALL AUTONOMOUS OPERATIONS STOPPED.'))
            
            # Log the event
            # We use a system user or generic actor if possible, here we just log to stdout implies admin action
            # Ideally we log to EvidenceLog if we had a user context, but management commands are outside request context.
            
        elif options['off']:
            cache.delete('SOVEREIGN_AI_HALTED')
            SystemFlag.set_flag('SOVEREIGN_AI_HALTED', False)
            self.stdout.write(self.style.SUCCESS('✅ SOVEREIGN AI RESTORED. SYSTEMS NORMAL.'))
        else:
            is_halted = cache.get('SOVEREIGN_AI_HALTED', False) or SystemFlag.get_flag('SOVEREIGN_AI_HALTED', False)
            status = "HALTED 🛑" if is_halted else "OPERATIONAL 🟢"
            self.stdout.write(f"Current Status: {status}")
