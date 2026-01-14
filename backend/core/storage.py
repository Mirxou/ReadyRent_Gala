"""
Custom storage backends for file handling.
"""
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class MediaStorage(S3Boto3Storage):
    """Custom storage for media files."""
    location = 'media'
    file_overwrite = False


class StaticStorage(S3Boto3Storage):
    """Custom storage for static files."""
    location = 'static'
    file_overwrite = True


# Image optimization settings
IMAGE_OPTIMIZATION_ENABLED = getattr(settings, 'IMAGE_OPTIMIZATION_ENABLED', True)
IMAGE_MAX_SIZE = getattr(settings, 'IMAGE_MAX_SIZE', (1920, 1920))
IMAGE_QUALITY = getattr(settings, 'IMAGE_QUALITY', 85)
CDN_DOMAIN = getattr(settings, 'CDN_DOMAIN', None)
