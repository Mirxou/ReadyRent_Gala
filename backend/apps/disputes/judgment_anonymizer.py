"""
Judgment Anonymization Service for Phase 23: Public Transparency

Sovereign Safeguards:
1. Publication Delay (60-90 days for high-risk)
2. Dynamic Redaction (region/amounts)
3. Uniqueness Scoring (0-100)
4. AI-validated rewriting (rules check AI output)
5. PII Protection (zero leakage)
"""
import hashlib
import re
from datetime import timedelta
from decimal import Decimal
from typing import Dict, List, Optional

from django.conf import settings
from django.utils import timezone
from django.db.models import Count, Q

from apps.disputes.models import (
    Judgment,
    AnonymizedJudgment,
    EvidenceLog
)


class JudgmentAnonymizer:
    """
    Safe anonymization with fail-safes.
    
    Sovereign Principle: Anonymization is a RIGHT, not a technical detail.
    """
    
    # Anonymization salt (should be in settings)
    SALT = getattr(settings, 'JUDGMENT_ANONYMIZATION_SALT', 'readygala-sovereign-salt-2026')
    
    # Risk thresholds
    CATEGORY_RARITY_THRESHOLD = 10  # < 10 cases/month = high-risk
    REGION_CONCENTRATION_THRESHOLD = 3  # < 3 cases/month = high-risk
    
    # Uniqueness score thresholds
    UNIQUENESS_IMMEDIATE = 30  # < 30 = publish immediately
    UNIQUENESS_REDACT = 60     # 30-60 = apply dynamic redaction
    # > 60 = delay 90 days OR heavy redaction
    
    @staticmethod
    def anonymize_judgment(judgment: Judgment) -> AnonymizedJudgment:
        """
        Main entry point: Convert Judgment → AnonymizedJudgment
        
        Steps:
        1. Extract safe data
        2. Calculate uniqueness score
        3. Apply dynamic redaction if needed
        4. Generate hash
        5. Determine publication delay
        6. Create AnonymizedJudgment
        """
        # Step 1: Extract safe categories
        category = judgment.dispute.booking.product.category.name if judgment.dispute.booking else "Unknown"
        dispute_type = judgment.dispute.title
        
        # Step 2: AI-generated summary (with rule-based validation)
        ruling_summary = JudgmentAnonymizer._generate_safe_summary(
            judgment.ruling_text,
            judgment.verdict
        )
        
        # Step 3: Calculate awarded ratio
        awarded_ratio = None
        if judgment.dispute.booking and judgment.awarded_amount:
            total_price = float(judgment.dispute.booking.total_price)
            if total_price > 0:
                awarded_ratio = (float(judgment.awarded_amount) / total_price) * 100
        
        # Step 4: Extract evidence types
        evidence_types = JudgmentAnonymizer._extract_evidence_types(judgment)
        
        # Step 5: Round date to month precision
        judgment_date = judgment.finalized_at.replace(day=1).date()
        
        # Step 6: Geographic region (city level)
        geographic_region = None
        if judgment.dispute.booking and judgment.dispute.booking.product.owner.profile:
            geographic_region = judgment.dispute.booking.product.owner.profile.city
        
        # Step 7: Calculate uniqueness score
        uniqueness_score = JudgmentAnonymizer._calculate_uniqueness_score(
            category=category,
            geographic_region=geographic_region,
            judgment_date=judgment_date,
            evidence_types=evidence_types
        )
        
        # Step 8: Apply dynamic redaction based on uniqueness
        if uniqueness_score >= JudgmentAnonymizer.UNIQUENESS_REDACT:
            # High uniqueness → Redact sensitive fields
            if uniqueness_score >= 70:
                # Very high → Redact both
                awarded_ratio = None
                geographic_region = None
            elif uniqueness_score >= 60:
                # High → Redact region
                geographic_region = None
        
        # Step 9: Determine publication delay
        publication_delayed_until = None
        if uniqueness_score > JudgmentAnonymizer.UNIQUENESS_REDACT:
            # Delay 90 days for high-risk
            publication_delayed_until = (timezone.now() + timedelta(days=90)).date()
        
        # Step 10: Generate judgment hash
        judgment_hash = hashlib.sha256(
            f"{judgment.id}:{JudgmentAnonymizer.SALT}".encode()
        ).hexdigest()
        
        # Step 11: Get consistency score from judgment
        consistency_score = getattr(judgment, 'consistency_score', 0)
        
        # Step 12: Count similar cases
        similar_cases_count = 0  # TODO: Integrate with Phase 22 precedent search
        
        # Step 13: Create or update AnonymizedJudgment
        anonymized, created = AnonymizedJudgment.objects.update_or_create(
            judgment_hash=judgment_hash,
            defaults={
                'category': category,
                'dispute_type': dispute_type,
                'ruling_summary': ruling_summary,
                'verdict': judgment.verdict,
                'awarded_ratio': awarded_ratio,
                'evidence_types': evidence_types,
                'consistency_score': consistency_score,
                'similar_cases_count': similar_cases_count,
                'judgment_date': judgment_date,
                'geographic_region': geographic_region,
                'uniqueness_score': uniqueness_score,
                'publication_delayed_until': publication_delayed_until,
            }
        )
        
        return anonymized
    
    @staticmethod
    def _calculate_uniqueness_score(
        category: str,
        geographic_region: Optional[str],
        judgment_date,
        evidence_types: List[str]
    ) -> int:
        """
        Calculate uniqueness risk (0-100).
        
        Higher score = more unique/identifiable = higher privacy risk
        
        Sovereign Safeguard #1: Publication Delay + Dynamic Redaction
        """
        score = 0
        
        # Check 1: Category rarity
        category_count = AnonymizedJudgment.objects.filter(
            category=category,
            judgment_date__year=judgment_date.year
        ).count()
        
        if category_count < JudgmentAnonymizer.CATEGORY_RARITY_THRESHOLD:
            score += 40
        elif category_count < 30:
            score += 20
        
        # Check 2: Geographic concentration
        if geographic_region:
            region_count = AnonymizedJudgment.objects.filter(
                geographic_region=geographic_region,
                judgment_date__year=judgment_date.year,
                judgment_date__month=judgment_date.month
            ).count()
            
            if region_count < JudgmentAnonymizer.REGION_CONCENTRATION_THRESHOLD:
                score += 40
            elif region_count < 10:
                score += 20
        
        # Check 3: Evidence uniqueness (rare combinations)
        rare_evidence = ['witness', 'expert_testimony', 'video']
        if any(ev in evidence_types for ev in rare_evidence):
            score += 20
        
        return min(score, 100)
    
    @staticmethod
    def _extract_evidence_types(judgment: Judgment) -> List[str]:
        """Extract evidence types from EvidenceLog."""
        evidence_logs = EvidenceLog.objects.filter(
            dispute=judgment.dispute
        )
        
        evidence_types = set()
        for log in evidence_logs:
            action = log.action.lower()
            if 'photo' in action or 'image' in action:
                evidence_types.add('photo')
            elif 'contract' in action or 'document' in action:
                evidence_types.add('contract')
            elif 'witness' in action:
                evidence_types.add('witness')
            elif 'video' in action:
                evidence_types.add('video')
        
        return list(evidence_types)
    
    @staticmethod
    def _generate_safe_summary(ruling_text: str, verdict: str) -> str:
        """
        Generate anonymized summary of ruling.
        
        Sovereign Safeguard #5: AI Assistant, Not Writer
        - AI suggests rewrite
        - Rule-based validation checks output
        - Fallback to template if validation fails
        
        TODO: Integrate with actual AI/LLM when ready
        """
        # For now, use template-based anonymization
        # TODO: Replace with AI rewriting + validation
        
        # Remove obvious PII patterns
        safe_text = ruling_text
        
        # Remove names (simple pattern - enhance later)
        safe_text = re.sub(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', '[NAME]', safe_text)
        safe_text = re.sub(r'\b[أ-ي]+ [أ-ي]+\b', '[NAME]', safe_text)
        
        # Remove specific locations (enhance based on Algerian provinces)
        provinces = ['Algiers', 'Oran', 'Constantine', 'Tlemcen', 'Tindouf', 'الجزائر', 'وهران', 'قسنطينة']
        for province in provinces:
            safe_text = safe_text.replace(province, '[LOCATION]')
        
        # Remove phone numbers
        safe_text = re.sub(r'\b0\d{9}\b', '[PHONE]', safe_text)
        safe_text = re.sub(r'\+213\s?\d+', '[PHONE]', safe_text)
        
        # Remove email addresses
        safe_text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', safe_text)
        
        # Truncate if too long (max 500 chars)
        if len(safe_text) > 500:
            safe_text = safe_text[:497] + "..."
        
        return safe_text
    
    @staticmethod
    def validate_anonymization(
        original_text: str,
        anonymized_text: str,
        verdict: str
    ) -> bool:
        """
        Rule-based validation of anonymized text.
        
        Returns True if safe, False if PII detected.
        """
        # Check 1: No phone numbers
        if re.search(r'\b0\d{9}\b', anonymized_text):
            return False
        if re.search(r'\+213', anonymized_text):
            return False
        
        # Check 2: No email addresses
        if re.search(r'@', anonymized_text):
            return False
        
        # Check 3: Verdict unchanged
        if verdict not in anonymized_text:
            # Verdict must be preserved
            return False
        
        # Check 4: No obvious PII markers
        pii_keywords = ['ID:', 'CIN:', 'Passport:', 'بطاقة', 'جواز']
        if any(kw in anonymized_text for kw in pii_keywords):
            return False
        
        return True
    
    @staticmethod
    def is_safely_anonymous(anonymized: AnonymizedJudgment) -> bool:
        """
        Verify no combination of fields can identify specific user.
        
        Check: Are there at least 3 similar judgments?
        """
        similar_count = AnonymizedJudgment.objects.filter(
            category=anonymized.category,
            geographic_region=anonymized.geographic_region,
            judgment_date=anonymized.judgment_date
        ).count()
        
        # Need at least 3 similar cases to publish
        return similar_count >= 3
    
    @staticmethod
    def should_publish(anonymized: AnonymizedJudgment) -> bool:
        """
        Determine if anonymized judgment should be publicly visible.
        
        Checks:
        1. Publication delay passed?
        2. Uniqueness score acceptable?
        3. At least 3 similar cases?
        """
        # Check 1: Publication delay
        if anonymized.publication_delayed_until:
            if timezone.now().date() < anonymized.publication_delayed_until:
                return False
        
        # Check 2: Uniqueness threshold
        if anonymized.uniqueness_score > 80:
            # Too unique, never publish without heavy redaction
            return False
        
        # Check 3: Safety check
        if not JudgmentAnonymizer.is_safely_anonymous(anonymized):
            return False
        
        return True
