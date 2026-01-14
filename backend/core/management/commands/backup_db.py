"""
Django management command to backup the database
"""
import os
import gzip
import subprocess
from datetime import datetime
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Backup the database to a compressed file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default=getattr(settings, 'BACKUP_DIR', os.path.join(settings.BASE_DIR, 'backups')),
            help='Directory to save the backup file'
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['sql', 'json'],
            default='sql',
            help='Backup format (sql or json)'
        )

    def handle(self, *args, **options):
        output_dir = options['output_dir']
        backup_format = options['format']
        
        # Create backup directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Get database settings
        db_settings = settings.DATABASES['default']
        db_engine = db_settings.get('ENGINE', '')
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if 'postgresql' in db_engine.lower():
            # PostgreSQL backup using pg_dump
            db_name = db_settings.get('NAME')
            db_user = db_settings.get('USER')
            db_password = db_settings.get('PASSWORD')
            db_host = db_settings.get('HOST', 'localhost')
            db_port = db_settings.get('PORT', '5432')
            
            backup_filename = f'db_backup_{timestamp}.sql'
            backup_path = os.path.join(output_dir, backup_filename)
            compressed_path = f"{backup_path}.gz"
            
            # Set PGPASSWORD environment variable
            env = os.environ.copy()
            if db_password:
                env['PGPASSWORD'] = db_password
            
            # Build pg_dump command
            cmd = [
                'pg_dump',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', db_name,
                '-F', 'c',  # Custom format
                '-f', backup_path
            ]
            
            try:
                self.stdout.write(f'Starting database backup...')
                result = subprocess.run(
                    cmd,
                    env=env,
                    check=True,
                    capture_output=True,
                    text=True
                )
                
                # Compress the backup
                self.stdout.write(f'Compressing backup...')
                with open(backup_path, 'rb') as f_in:
                    with gzip.open(compressed_path, 'wb') as f_out:
                        f_out.writelines(f_in)
                
                # Remove uncompressed file
                os.remove(backup_path)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created backup: {compressed_path}'
                    )
                )
                
                # Clean up old backups
                self.cleanup_old_backups(output_dir)
                
            except subprocess.CalledProcessError as e:
                self.stdout.write(
                    self.style.ERROR(f'Error backing up database: {e.stderr}')
                )
            except FileNotFoundError:
                self.stdout.write(
                    self.style.ERROR(
                        'pg_dump not found. Please install PostgreSQL client tools.'
                    )
                )
        
        elif 'sqlite' in db_engine.lower():
            # SQLite backup
            db_path = db_settings.get('NAME')
            backup_filename = f'db_backup_{timestamp}.db'
            backup_path = os.path.join(output_dir, backup_filename)
            compressed_path = f"{backup_path}.gz"
            
            try:
                self.stdout.write(f'Starting SQLite backup...')
                
                # Copy database file
                import shutil
                shutil.copy2(db_path, backup_path)
                
                # Compress
                with open(backup_path, 'rb') as f_in:
                    with gzip.open(compressed_path, 'wb') as f_out:
                        f_out.writelines(f_in)
                
                os.remove(backup_path)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created backup: {compressed_path}'
                    )
                )
                
                self.cleanup_old_backups(output_dir)
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error backing up database: {str(e)}')
                )
        
        else:
            self.stdout.write(
                self.style.ERROR(f'Unsupported database engine: {db_engine}')
            )

    def cleanup_old_backups(self, backup_dir, retention_days=7):
        """Remove backup files older than retention_days"""
        retention_days = getattr(settings, 'BACKUP_RETENTION_DAYS', retention_days)
        
        try:
            backup_files = Path(backup_dir).glob('db_backup_*.gz')
            current_time = datetime.now().timestamp()
            
            for backup_file in backup_files:
                file_age = current_time - backup_file.stat().st_mtime
                age_days = file_age / (24 * 60 * 60)
                
                if age_days > retention_days:
                    backup_file.unlink()
                    self.stdout.write(
                        f'Deleted old backup: {backup_file.name}'
                    )
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Error cleaning up old backups: {str(e)}')
            )

