"""
Django management command to create a demo admin user
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a demo admin user for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@readyrent.gala',
            help='Admin email address',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Admin password',
        )
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Admin username',
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        username = options['username']

        self.stdout.write(f'Creating demo admin user: {email}')

        # Create or get admin user
        admin, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )

        if created:
            admin.set_password(password)
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {email}'))
            self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
        else:
            admin.set_password(password)
            admin.save()
            self.stdout.write(self.style.WARNING(f'Admin user already exists: {email}'))
            self.stdout.write(self.style.WARNING('Password has been updated'))

        # Create user profile if doesn't exist
        profile, profile_created = UserProfile.objects.get_or_create(
            user=admin,
            defaults={
                'first_name_ar': 'مدير',
                'last_name_ar': 'النظام',
                'city': 'Constantine',
                'preferred_language': 'ar',
            }
        )

        if profile_created:
            self.stdout.write(self.style.SUCCESS('Created user profile'))

        self.stdout.write(self.style.SUCCESS('Demo admin user setup completed!'))

