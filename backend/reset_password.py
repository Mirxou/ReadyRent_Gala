"""
Script to reset superuser password
Usage: python reset_password.py <new_password>
   or: python reset_password.py (will set password to 'admin123')
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

# Get the user by email
email = 'abounaas54@gmail.com'

try:
    user = User.objects.get(email=email)
    print(f'\nUser found: {user.username} ({user.email})')
    
    # Get new password from command line argument or use default
    if len(sys.argv) > 1:
        new_password = sys.argv[1]
    else:
        new_password = 'admin123'
        print('\nNo password provided. Using default password: admin123')
        print('To set custom password, use: python reset_password.py <your_password>')
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    print(f'\n[SUCCESS] Password changed successfully!')
    print(f'\nLogin credentials:')
    print(f'  Username: {user.username}')
    print(f'  Email: {user.email}')
    print(f'  Password: {new_password}\n')
    
except User.DoesNotExist:
    print(f'\n[ERROR] User with email {email} not found!')
    print('\nAvailable superusers:')
    for u in User.objects.filter(is_superuser=True):
        print(f'  - {u.username} ({u.email})')
