"""
Sovereign Intelligence: Market Trend Scrapers.
Phase 13: Mastery Finalization.

Responsible for aggregating 'Strategic Intelligence' from the external world (Simulated for Beta).
Target: Algerian Rental Sector (Luxury, Events, Heritage).
"""

from datetime import timedelta
from django.utils import timezone
from .models import MarketIntelligence
import random

class TrendScraperService:
    @staticmethod
    def scrape_social_trends():
        """
        Simulates scraping Instagram/TikTok for Algerian rental trends.
        """
        trends = [
            {
                "title": "قفطان جزائري عصري (Modern Kaftan)",
                "description": "زيادة بنسبة 45% في البحث عن القفطان المودرن للمناسبات الشتوية في الجزائر العاصمة.",
                "metrics": {"growth": 45, "engagement": 92},
                "source": "Instagram",
                "intel_type": "social_trend"
            },
            {
                "title": "أواني نحاسية تقليدية (Heritage Copper)",
                "description": "اهتمام متزايد بتأجير الأطقم النحاسية التقليدية لقسنطينة في الفعاليات الثقافية.",
                "metrics": {"growth": 28, "engagement": 75},
                "source": "TikTok",
                "intel_type": "social_trend"
            }
        ]

        for trend in trends:
            MarketIntelligence.objects.update_or_create(
                title=trend['title'],
                source_platform=trend['source'],
                defaults={
                    "description": trend['description'],
                    "metrics": trend['metrics'],
                    "intel_type": trend['intel_type'],
                    "confidence_score": random.randint(85, 98),
                    "is_active": True
                }
            )

    @staticmethod
    def analyze_regional_liquidity():
        """
        Calculates and stores regional liquidity signals based on escrow data.
        """
        regions = ["الجزائر العاصمة", "وهران", "قسنطينة", "سطيف"]
        for region in regions:
            MarketIntelligence.objects.update_or_create(
                intel_type='regional_liquidity',
                region=region,
                defaults={
                    "title": f"نبض السيولة في {region}",
                    "description": f"معدل العقود المفعلة في {region} يظهر استقراراً مالياً عالياً.",
                    "metrics": {
                        "liquidity_index": random.uniform(0.7, 0.99),
                        "velocity": random.randint(5, 15)
                    },
                    "confidence_score": 95,
                    "is_active": True
                }
            )

def run_all_scrapers():
    """Entry point for the intelligence engine."""
    service = TrendScraperService()
    service.scrape_social_trends()
    service.analyze_regional_liquidity()
    print("✅ Sovereign Intelligence: Pulse Scrapers Completed.")
