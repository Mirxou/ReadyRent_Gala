from django.test import TestCase
from django.apps import apps
from standard_core.apps import StandardCoreConfig

class SkeletonLayerTest(TestCase):
    """
    Sovereign Test Level 0: Skeleton Verification.
    Ensures that the standard_core application is properly loaded into the Django Project.
    """
    
    def test_standard_core_is_installed(self):
        """Verify that standard_core is present in the app registry."""
        self.assertTrue(apps.is_installed('standard_core'), "Failure: standard_core is NOT installed.")
        
    def test_app_config_name(self):
        """Verify the AppConfig name matches the Sovereign Plan."""
        app_config = apps.get_app_config('standard_core')
        self.assertEqual(app_config.name, 'standard_core', "Failure: AppConfig name mismatch.")
