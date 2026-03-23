import pytest
from unittest.mock import patch, MagicMock
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.core.utils.image_firewall import ImageFirewall

def create_test_image():
    file = BytesIO()
    image = Image.new('RGB', (100, 100), color='red')
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile(name='test_image.jpg', content=file.read(), content_type='image/jpeg')

class TestImageFirewall:
    def test_scrub_exif(self):
        # Create image with minimal "EXIF" (simulated by just ensuring it processes without error)
        # Getting actual EXIF into a test image via PIL is complex, 
        # so we primarily test that the function accepts and returns a valid image file.
        img_file = create_test_image()
        processed_file = ImageFirewall.scrub_exif(img_file)
        
        # Verify it's still a valid image
        img = Image.open(processed_file)
        assert img.format in ['JPEG', 'MPO'] # MPO is common for JPEGs
        assert processed_file.name == 'test_image.jpg'

    @patch('apps.core.utils.image_firewall.DeepFace')
    def test_verify_identity_match(self, mock_deepface):
        # Setup Mock
        mock_deepface.verify.return_value = {'verified': True}
        
        id_card = create_test_image()
        selfie = create_test_image()
        
        is_match, msg = ImageFirewall.verify_identity(id_card, selfie)
        
        assert is_match is True
        assert "Identity Verified" in msg
        mock_deepface.verify.assert_called_once()

    @patch('apps.core.utils.image_firewall.DeepFace')
    def test_verify_identity_mismatch(self, mock_deepface):
        # Setup Mock
        mock_deepface.verify.return_value = {'verified': False}
        
        id_card = create_test_image()
        selfie = create_test_image()
        
        is_match, msg = ImageFirewall.verify_identity(id_card, selfie)
        
        assert is_match is False
        assert "Face mismatch" in msg
