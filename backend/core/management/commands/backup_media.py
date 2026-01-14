"""
Django management command to backup media files
"""
import os
import gzip
import shutil
import tarfile
from datetime import datetime
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Backup media files to a compressed archive'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default=getattr(settings, 'BACKUP_DIR', os.path.join(settings.BASE_DIR, 'backups')),
            help='Directory to save the backup file'
        )

    def handle(self, *args, **options):
        output_dir = options['output_dir']
        media_root = settings.MEDIA_ROOT
        
        if not os.path.exists(media_root):
            self.stdout.write(
                self.style.WARNING(f'Media directory does not exist: {media_root}')
            )
            return
        
        # Create backup directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'media_backup_{timestamp}.tar.gz'
        backup_path = os.path.join(output_dir, backup_filename)
        
        try:
            self.stdout.write(f'Starting media backup...')
            
            # Create compressed tar archive
            with tarfile.open(backup_path, 'w:gz') as tar:
                tar.add(media_root, arcname=os.path.basename(media_root))
            
            # Get file size
            file_size = os.path.getsize(backup_path) / (1024 * 1024)  # MB
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created backup: {backup_path} ({file_size:.2f} MB)'
                )
            )
            
            # Clean up old backups
            self.cleanup_old_backups(output_dir)
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error backing up media: {str(e)}')
            )

    def cleanup_old_backups(self, backup_dir, retention_days=7):
        """Remove backup files older than retention_days"""
        retention_days = getattr(settings, 'BACKUP_RETENTION_DAYS', 7)
        
        try:
            backup_files = Path(backup_dir).glob('media_backup_*.tar.gz')
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

