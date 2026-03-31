import structlog
import os
import sys
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

logger = structlog.get_logger("core.image_firewall")

# Try importing DeepFace, handle if not installed (though it should be)
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    logger.info("identity_verification_skipped_no_deepface")


class ImageFirewall:
    @staticmethod
    def scrub_exif(image_file):
        """
        Removes all EXIF metadata from the image for privacy.
        Returns a new InMemoryUploadedFile.
        """
        try:
            img = Image.open(image_file)
            
            # Create a new image without metadata
            image_without_exif = Image.new(img.mode, img.size)
            image_without_exif.paste(img)
            
            # Save to BytesIO
            output = BytesIO()
            img_format = img.format if img.format else 'JPEG'
            image_without_exif.save(output, format=img_format)
            output.seek(0)
            
            return InMemoryUploadedFile(
                output,
                'ImageField',
                image_file.name,
                image_file.content_type,
                sys.getsizeof(output),
                None
            )
        except Exception as e:
            # If scrubbing fails, return original or raise warning
            logger.error(
                "exif_scrubbing_failed",
                error=str(e),
                exc_info=True
            )
            return image_file

    @staticmethod
    def compress_image(image_file, quality=80):
        """
        Converts image to WebP and compresses it.
        """
        try:
            img = Image.open(image_file)
            output = BytesIO()
            
            # Convert to RGB if necessary (e.g. RGBA to JPEG/WebP)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
                
            img.save(output, format='WEBP', quality=quality)
            output.seek(0)
            
            # Change extension to .webp
            original_name = image_file.name
            new_name = os.path.splitext(original_name)[0] + '.webp'
            
            return InMemoryUploadedFile(
                output,
                'ImageField',
                new_name,
                'image/webp',
                sys.getsizeof(output),
                None
            )
        except Exception as e:
            logger.error(
                "image_compression_failed",
                error=str(e),
                exc_info=True
            )
            return image_file

    @staticmethod
    def verify_identity(id_card_file, selfie_file):
        """
        Verifies if the face in the selfie matches the ID card.
        Accepts InMemoryUploadedFile objects.
        Returns (True, message) or (False, error_message).
        """
        if not DEEPFACE_AVAILABLE:
            return True, "DeepFace not installed, skipping verification (Dev Mode)"

        try:
            import numpy as np

            # Convert InMemoryUploadedFile to numpy array via PIL
            def to_numpy(uploaded_file):
                img = Image.open(uploaded_file)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                return np.array(img)

            img1_array = to_numpy(id_card_file)
            img2_array = to_numpy(selfie_file)

            # DeepFace.verify returns specialized dictionary
            # enforcing detection backend to opencv for speed and cpu compatibility
            result = DeepFace.verify(
                img1_path=img1_array,
                img2_path=img2_array,
                model_name="VGG-Face", 
                detector_backend="opencv", 
                distance_metric="cosine",
                enforce_detection=False # Don't crash if face not found, handle result
            )
            
            if result['verified']:
                return True, "Identity Verified"
            else:
                return False, "Face mismatch: Selfie does not match ID Card."
                
        except Exception as e:
            return False, f"Verification process failed: {str(e)}"
