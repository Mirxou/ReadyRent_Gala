import hashlib
from django.utils import timezone
from .models import AnonymizedJudgment, EvidenceLog

class AnonymizationService:
    """
    Phase 38: The Public Ledger.
    Responsible for stripping PII and creating de-identified records 
    of finalized judgments.
    """
    
    @staticmethod
    def anonymize(judgment):
        """
        Processes a real Judgment and creates/updates an AnonymizedJudgment.
        """
        dispute = judgment.dispute
        
        # 1. Generate unique but de-identified hash
        # We use a simple salt (could be moved to settings)
        salt = "SovereignLedger2026"
        raw_id = f"{judgment.id}-{salt}"
        judgment_hash = hashlib.sha256(raw_id.encode()).hexdigest()
        
        # 2. Extract Evidence Types (safe for public)
        evidence_types = list(set([
            log.action for log in dispute.evidence_trail.all()
        ]))
        
        # 3. Create Summary (stripped of names - basic placeholder for now)
        # In a real system, this would use a small LLM or regex to strip entities
        summary = judgment.ruling_text
        if len(summary) > 500:
            summary = summary[:497] + "..."

        # 4. Calculate Ratio (if applicable)
        awarded_ratio = None
        # Placeholder logic: if we have a way to know the 'claimed' amount, 
        # we'd calculate ratio. For now, we'll leave as None or static.

        # 5. Determine Consistency Score (from Phase 37 legacy if available)
        # For now, we'll set a default or use related_precedents count
        similar_count = getattr(dispute, '_related_precedents_count', 0)
        
        # 6. Rounded Date (First of the month for privacy)
        rounded_date = judgment.finalized_at.date().replace(day=1)
        
        # 7. Persistence
        anonymized, created = AnonymizedJudgment.objects.update_or_create(
            judgment_hash=judgment_hash,
            defaults={
                'category': 'Rent/Property', # TODO: Get from dispute.category
                'dispute_type': dispute.title,
                'ruling_summary': summary,
                'verdict': judgment.verdict,
                'awarded_ratio': awarded_ratio,
                'evidence_types': evidence_types,
                'consistency_score': 100, # Placeholder
                'similar_cases_count': similar_count,
                'judgment_date': rounded_date,
                'published_at': timezone.now()
            }
        )
        
        return anonymized
