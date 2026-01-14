"""
Image optimization service for processing and generating thumbnails
"""
import os
from io import BytesIO
from PIL import Image, ImageOps
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.files.base import ContentFile
from django.conf import settings
import sys


class ImageOptimizationService:
    """Service for image optimization and thumbnail generation"""
    
    # Thumbnail sizes
    THUMBNAIL_SIZES = {
        'thumbnail': (150, 150),  # Small thumbnail
        'small': (300, 300),      # Small preview
        'medium': (600, 600),     # Medium preview
        'large': (1200, 1200),    # Large preview
    }
    
    # Image quality settings
    JPEG_QUALITY = 85
    PNG_QUALITY = 90
    WEBP_QUALITY = 85
    
    @staticmethod
    def optimize_image(image_file, max_size=(1920, 1920), quality=85):
        """
        Optimize image by resizing and compressing
        
        Args:
            image_file: The uploaded image file
            max_size: Maximum dimensions (width, height)
            quality: JPEG quality (1-100)
            
        Returns:
            Optimized image as InMemoryUploadedFile
        """
        try:
            # Open image
            img = Image.open(image_file)
            
            # Convert RGBA to RGB if necessary (for JPEG)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Auto-orient based on EXIF data
            img = ImageOps.exif_transpose(img)
            
            # Resize if image is larger than max_size
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save to BytesIO
            output = BytesIO()
            
            # Check if WebP is supported and preferred
            use_webp = getattr(settings, 'USE_WEBP_FORMAT', False)
            if use_webp:
                try:
                    img.save(output, format='WEBP', quality=ImageOptimizationService.WEBP_QUALITY, method=6)
                    output.seek(0)
                    filename = os.path.splitext(image_file.name)[0] + '.webp'
                    optimized_file = InMemoryUploadedFile(
                        output,
                        'ImageField',
                        filename,
                        'image/webp',
                        sys.getsizeof(output),
                        None
                    )
                    return optimized_file
                except Exception:
                    # Fallback to JPEG if WebP fails
                    pass
            
            # Default: Save as JPEG
            img.save(output, format='JPEG', quality=quality, optimize=True)
            output.seek(0)
            
            # Create new file
            filename = os.path.splitext(image_file.name)[0] + '.jpg'
            optimized_file = InMemoryUploadedFile(
                output,
                'ImageField',
                filename,
                'image/jpeg',
                sys.getsizeof(output),
                None
            )
            
            return optimized_file
            
        except Exception as e:
            # If optimization fails, return original
            image_file.seek(0)
            return image_file
    
    @staticmethod
    def generate_thumbnail(image_file, size_name='thumbnail'):
        """
        Generate a thumbnail from an image
        
        Args:
            image_file: The source image file
            size_name: Size name from THUMBNAIL_SIZES
            
        Returns:
            Thumbnail as InMemoryUploadedFile or None
        """
        try:
            if size_name not in ImageOptimizationService.THUMBNAIL_SIZES:
                return None
            
            size = ImageOptimizationService.THUMBNAIL_SIZES[size_name]
            
            # Open and process image
            img = Image.open(image_file)
            
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Auto-orient
            img = ImageOps.exif_transpose(img)
            
            # Resize with maintaining aspect ratio
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save to BytesIO
            output = BytesIO()
            
            # Check if WebP is supported and preferred
            use_webp = getattr(settings, 'USE_WEBP_FORMAT', False)
            if use_webp:
                try:
                    img.save(output, format='WEBP', quality=ImageOptimizationService.WEBP_QUALITY, method=6)
                    output.seek(0)
                    base_name = os.path.splitext(image_file.name)[0]
                    filename = f"{base_name}_{size_name}.webp"
                    thumbnail_file = InMemoryUploadedFile(
                        output,
                        'ImageField',
                        filename,
                        'image/webp',
                        sys.getsizeof(output),
                        None
                    )
                    return thumbnail_file
                except Exception:
                    # Fallback to JPEG if WebP fails
                    pass
            
            # Default: Save as JPEG
            img.save(output, format='JPEG', quality=ImageOptimizationService.JPEG_QUALITY, optimize=True)
            output.seek(0)
            
            # Create filename
            base_name = os.path.splitext(image_file.name)[0]
            filename = f"{base_name}_{size_name}.jpg"
            
            thumbnail_file = InMemoryUploadedFile(
                output,
                'ImageField',
                filename,
                'image/jpeg',
                sys.getsizeof(output),
                None
            )
            
            return thumbnail_file
            
        except Exception as e:
            print(f"Error generating thumbnail: {str(e)}")
            return None
    
    @staticmethod
    def get_image_url(image_field, size_name=None):
        """
        Get optimized image URL (with CDN if configured)
        
        Args:
            image_field: ImageField instance
            size_name: Optional thumbnail size name
            
        Returns:
            Image URL string
        """
        if not image_field:
            return None
        
        url = image_field.url
        
        # Add CDN domain if configured
        cdn_domain = getattr(settings, 'CDN_DOMAIN', None)
        if cdn_domain:
            # Replace media URL with CDN domain
            media_url = settings.MEDIA_URL
            if url.startswith(media_url):
                url = url.replace(media_url, f"https://{cdn_domain}/")
        
        return url
    
    @staticmethod
    def generate_all_thumbnails(image_file):
        """
        Generate all thumbnail sizes for an image
        
        Args:
            image_file: Source image file
            
        Returns:
            Dictionary of thumbnail files keyed by size name
        """
        thumbnails = {}
        
        for size_name in ImageOptimizationService.THUMBNAIL_SIZES.keys():
            thumbnail = ImageOptimizationService.generate_thumbnail(image_file, size_name)
            if thumbnail:
                thumbnails[size_name] = thumbnail
                image_file.seek(0)  # Reset file pointer for next thumbnail
        
        return thumbnails


