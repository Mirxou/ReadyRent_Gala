"""
Celery tasks for analytics and maintenance (backups)
"""
from celery import shared_task
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)


@shared_task
def backup_database():
    """Daily database backup task"""
    try:
        call_command('backup_db')
        logger.info('Database backup completed successfully')
        return 'Database backup completed'
    except Exception as e:
        logger.error(f'Database backup failed: {str(e)}')
        raise


@shared_task
def backup_media_files():
    """Daily media files backup task"""
    try:
        call_command('backup_media')
        logger.info('Media backup completed successfully')
        return 'Media backup completed'
    except Exception as e:
        logger.error(f'Media backup failed: {str(e)}')
        raise


@shared_task
def full_backup():
    """Full backup task (database + media)"""
    try:
        call_command('backup_db')
        call_command('backup_media')
        logger.info('Full backup completed successfully')
        return 'Full backup completed'
    except Exception as e:
        logger.error(f'Full backup failed: {str(e)}')
        raise

