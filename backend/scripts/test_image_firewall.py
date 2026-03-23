import os
import sys
import django
from io import BytesIO
from PIL import Image, ExifTags

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.image_optimization import ImageOptimizationService
from django.core.files.uploadedfile import SimpleUploadedFile

def create_image_with_exif():
    """Create a dummy image with fake GPS data in EXIF"""
    img = Image.new('RGB', (100, 100), color='red')
    
    # Minimal EXIF data
    exif = Image.Exif()
    # GPSInfo tag is 34853
    # We can't easily construct valid GPS blobs via Pillow's Exif class directly 
    # without some byte manipulation, but we can verify if ANY exif survives.
    # Let's try inserting a simple UserComment (0x9286)
    exif[0x9286] = "SENSITIVE_DATA_HERE"
    
    output = BytesIO()
    img.save(output, format='JPEG', exif=exif)
    output.seek(0)
    return output

def verify_firewall():
    print("🔥 Testing Image Firewall...")
    
    # 1. Create malicious image
    original = create_image_with_exif()
    uploaded_file = SimpleUploadedFile("test_hack.jpg", original.read(), content_type="image/jpeg")
    
    # Verify original has EXIF
    original.seek(0)
    img_check = Image.open(original)
    exif_data = img_check.getexif()
    if exif_data and exif_data.get(0x9286):
        print("✅ setup: Original image contains sensitive EXIF data.")
    else:
        print("⚠️ setup: Could not create EXIF data properly (Pillow limitation?), proceeding anyway.")

    # 2. Pass through Firewall (Optimization Service)
    print("   Running optimization...")
    optimized_file = ImageOptimizationService.optimize_image(uploaded_file)
    
    # 3. Analyze Result
    if not optimized_file:
        print("❌ FAILED: Optimization returned None")
        return

    # Check Format (Should be WebP)
    print(f"   Output filename: {optimized_file.name}")
    if not optimized_file.name.endswith('.webp'):
        print("❌ FAILED: Image was not converted to WebP!")
    else:
        print("✅ Success: Image converted to WebP.")

    # Check Content (No EXIF)
    optimized_file.seek(0)
    result_img = Image.open(optimized_file)
    
    # WebP metadata handling in Pillow
    info = result_img.info
    exif_result = info.get('exif')
    
    if exif_result:
        # Check if our tag survived
        # Just presence of EXIF bytes is suspicious if we want total scrub
        print(f"⚠️ Warning: Some Metadata bytes found ({len(exif_result)} bytes). Checking content...")
        if b"SENSITIVE_DATA_HERE" in exif_result:
             print("❌ FAILED: Sensitive EXIF data survived!")
        else:
             print("✅ Success: Sensitive EXIF data removed (Clean Metadata).")
    else:
        print("✅ Success: No EXIF data found at all (Clean).")

if __name__ == "__main__":
    verify_firewall()
