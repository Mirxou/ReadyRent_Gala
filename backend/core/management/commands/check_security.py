"""
Django management command to check security settings
"""
from django.core.management.base import BaseCommand
from config.security import SecurityConfig


class Command(BaseCommand):
    help = 'Check security settings and configuration'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('🔒 Security Configuration Check\n'))
        
        # Check production settings
        self.stdout.write(self.style.SUCCESS('Checking production settings...'))
        production_issues = SecurityConfig.check_production_settings()
        if production_issues:
            for issue in production_issues:
                self.stdout.write(self.style.ERROR(f'  ❌ {issue}'))
        else:
            self.stdout.write(self.style.SUCCESS('  ✅ Production settings are correct'))
        
        # Check CORS settings
        self.stdout.write(self.style.SUCCESS('\nChecking CORS settings...'))
        cors_issues = SecurityConfig.check_cors_settings()
        if cors_issues:
            for issue in cors_issues:
                self.stdout.write(self.style.ERROR(f'  ❌ {issue}'))
        else:
            self.stdout.write(self.style.SUCCESS('  ✅ CORS settings are correct'))
        
        # Summary
        total_issues = len(production_issues) + len(cors_issues)
        if total_issues > 0:
            self.stdout.write(self.style.ERROR(f'\n⚠️  Found {total_issues} security issue(s)'))
            self.stdout.write(self.style.WARNING('Please review and fix these issues before production deployment.'))
        else:
            self.stdout.write(self.style.SUCCESS('\n✅ All security checks passed!'))

