
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from apps.products.models import Product

from constance import config

class SovereignLaunchPolicy:
    """
    Sovereign Launch Constraints (Phase 16/17):
    - Regulated by Dynamic Config (The Gates).
    - Enforced by Regional Readiness Score (RRS).
    """

    @classmethod
    def get_green_wilayas(cls):
        """Full Sovereignty (Open Expansion)"""
        return getattr(config, 'SOVEREIGN_WILAYAS_GREEN', [])

    @classmethod
    def get_yellow_wilayas(cls):
        """Controlled Expansion (Incubation)"""
        return getattr(config, 'SOVEREIGN_WILAYAS_YELLOW', [])

    @classmethod
    def get_yellow_zone_categories(cls):
        """Restricted Arsenal for Yellow Zone"""
        return getattr(config, 'SOVEREIGN_YELLOW_ZONE_CATEGORIES', ['electronics'])

    @classmethod
    def get_global_allowed_categories(cls):
        """Global Arsenal (Green Zone)"""
        return config.SOVEREIGN_ALLOWED_CATEGORIES

    @classmethod
    def validate_booking(cls, product: Product):
        """
        Validates if a product can be booked based on The Sovereign Spectrum.
        - Green Zone: Full Global Access.
        - Yellow Zone: Restricted Categories Only.
        - Red Zone: Total Blockade.
        """
        # 0. Data Integrity
        if not product.wilaya:
            raise ValidationError(_("Product location (Wilaya) is required for Sovereign Validation."))
        if not product.category:
            raise ValidationError(_("Product must have a category for Sovereign Validation."))

        wilaya_id = product.wilaya
        category_slug = product.category.slug

        # 1. Determine Zone (Territory Check)
        is_green = wilaya_id in cls.get_green_wilayas()
        is_yellow = wilaya_id in cls.get_yellow_wilayas()

        if not is_green and not is_yellow:
            # RED ZONE
            raise ValidationError(
                _("Sovereign Restriction: Region {wilaya} is currently in the Red Zone (Closed).").format(wilaya=wilaya_id)
            )

        # 2. Category Check (The Arsenal)
        if is_green:
            # Green Zone: Can access Global Allowed List
            allowed_categories = cls.get_global_allowed_categories()
            if category_slug not in allowed_categories:
                 raise ValidationError(
                     _("Sovereign Restriction (Green Zone): Category '{category}' is not yet in the Federation Arsenal.").format(category=category_slug)
                 )
        
        elif is_yellow:
            # Yellow Zone: Can ONLY access Yellow List
            yellow_categories = cls.get_yellow_zone_categories()
            if category_slug not in yellow_categories:
                 raise ValidationError(
                     _("Sovereign Restriction (Yellow Zone): Region {wilaya} is in Incubation. Only {allowed} are permitted.").format(
                         wilaya=wilaya_id, allowed=yellow_categories
                     )
                 )

        return True
