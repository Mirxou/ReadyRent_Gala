"""
Viral Service (2030 Edition)
Generates high-fidelity, "Holographic-Ready" metadata for social sharing.
Transforms raw database rows into vibrant, shareable "Digital Cards".
"""
from django.conf import settings
from apps.users.models import User
from apps.products.models import Product

class ViralService:
    """
    The engine behind the "Shiny" UI.
    Maps Risk Scores to Cyber-Aesthetics.
    """
    
    # 2030 Tier Definitions (Arabic Localized)
    # Format: (MaxRisk, Name, HexColor, Emoji, ArabicName)
    TIERS = [
        (10, 'Oracle (Elite)', '#FFD700', '🛡️', 'النخبة (Oracle)'),
        (30, 'Guardian', '#00F3FF', '💠', 'الحارس (Guardian)'),
        (50, 'Citizen', '#00FF9D', '✅', 'المواطن (Citizen)'),
        (80, 'Drifter', '#FFA500', '⚠️', 'التائه (Drifter)'),
        (100, 'Unknown', '#FF0000', '🚫', 'مجهول'),
    ]

    @staticmethod
    def _get_tier(risk_score):
        """Map a risk score to a visual tier."""
        for max_risk, name, color, icon, ar_name in ViralService.TIERS:
            if risk_score <= max_risk:
                return {'name': name, 'color': color, 'icon': icon, 'ar_name': ar_name}
        return {'name': 'Unknown', 'color': '#000000', 'icon': '❓', 'ar_name': 'مجهول'}

    @staticmethod
    def generate_trust_card(user):
        """
        Generates a 'Holographic Identity Card' payload.
        Used for: Profile headers, Share links, QR Code splash screens.
        """
        # 1. Calculate Live Data
        try:
            risk = user.verification.risk_score
        except:
            risk = 50 # Default
            
        tier = ViralService._get_tier(risk)
        # Simplify timezone logic for robustness
        now = django.utils.timezone.now()
        membership_days = (now - user.created_at).days if user.created_at else 0

        # 2. Construct 2030 Payload
        trust_score = 100 - risk
        return {
            "card_type": "IDENTITY_HOLO",
            "visuals": {
                "theme_color": tier['color'],
                "badge_icon": tier['icon'],
                "backdrop_effect": "glassmorphism", # Frontend hint
            },
            "data": {
                "username": user.username,
                "tier_label": tier['name'],
                "tier_label_ar": tier['ar_name'],
                "trust_score": trust_score, # In 2030, we show Trust (Positive), not Risk (Negative)
                "vouches": user.vouches_received.count(),
                "member_since_days": membership_days,
            },
            "share_text": f"🔐 أنا عضو {tier['ar_name']} في STANDARD.Rent. نسبة الثقة: {trust_score}/100. زكّني الآن!"
        }

    @staticmethod
    def generate_product_card(product):
        """
        Generates a 'Product Holo-Tag'.
        Used for: Viral listing shares, Map markers.
        """
        owner_card = ViralService.generate_trust_card(product.owner)
        owner_tier_ar = owner_card['data']['tier_label_ar']
        
        return {
            "card_type": "ASSET_HOLO",
            "visuals": {
                "primary_color": owner_card['visuals']['theme_color'], # Inherit owner's aura
                "overlay_opacity": 0.85
            },
            "data": {
                "title": product.name,
                "price_display": f"{product.price_display if hasattr(product, 'price_display') else f'{product.price_per_day:,.0f} DZD'}",
                "owner_tier": owner_card['data']['tier_label'],
                "owner_tier_ar": owner_tier_ar,
                "owner_trust": owner_card['data']['trust_score'],
                "is_verified_asset": product.owner.verification.status == 'verified' if hasattr(product.owner, 'verification') else False
            },
            "share_text": f"📦 استأجر '{product.name}' من مالك موثوق ({owner_tier_ar})! #STANDARD_Rent"
        }

import django.utils.timezone
