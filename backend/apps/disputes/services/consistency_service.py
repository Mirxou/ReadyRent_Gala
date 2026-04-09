from django.db.models import Q
from ..models import Judgment, JudgmentPrecedent, EvidenceLog
from decimal import Decimal

class ConsistencyService:
    """
    The Institutional Memory Engine.
    Evaluates new judgments against historical precedents to ensure consistency.
    
    User Feedback Integration:
    - Measures, not enforces
    - Explains divergence, doesn't punish
    - Bootstrap handling (first 5 judgments)
    """

    # Thresholds
    MIN_JUDGMENTS_FOR_BASELINE = 5
    HIGH_CONSISTENCY = 0.90
    MODERATE_CONSISTENCY = 0.70
    
    @staticmethod
    def evaluate_judgment(judgment: Judgment) -> dict:
        """
        Evaluate a new judgment against historical precedents.
        
        Returns:
            dict: {
                "consistency_score": float (0-1) or None,
                "recommendation": str,
                "precedents_found": int,
                "similar_cases": list,
                "divergence_flags": list
            }
        """
        dispute = judgment.dispute
        
        # Bootstrap Check: Not enough judgments exist yet
        total_judgments = Judgment.objects.filter(status='final').count()
        
        if total_judgments < ConsistencyService.MIN_JUDGMENTS_FOR_BASELINE:
            return {
                "consistency_score": None,
                "recommendation": "ESTABLISHING_BASELINE",
                "precedents_found": 0,
                "similar_cases": [],
                "divergence_flags": [],
                "message": f"Building institutional memory ({total_judgments}/{ConsistencyService.MIN_JUDGMENTS_FOR_BASELINE} baseline judgments)"
            }
        
        # Find Similar Disputes
        similar_judgments = ConsistencyService._find_similar_judgments(judgment)
        
        if not similar_judgments:
            return {
                "consistency_score": None,
                "recommendation": "NO_PRECEDENTS",
                "precedents_found": 0,
                "similar_cases": [],
                "divergence_flags": [],
                "message": "No sufficiently similar cases found in history."
            }
        
        # Calculate Consistency
        consistency_metrics = ConsistencyService._calculate_consistency(
            judgment, similar_judgments
        )
        
        # Generate Recommendation
        score = consistency_metrics['average_similarity']
        recommendation = "DIVERGENT"
        
        if score >= ConsistencyService.HIGH_CONSISTENCY:
            recommendation = "HIGHLY_CONSISTENT"
        elif score >= ConsistencyService.MODERATE_CONSISTENCY:
            recommendation = "MODERATELY_CONSISTENT"
        
        # Link Precedents (Create JudgmentPrecedent records)
        for precedent_data in consistency_metrics['precedents']:
            JudgmentPrecedent.objects.get_or_create(
                judgment=judgment,
                precedent=precedent_data['judgment'],
                defaults={
                    'similarity_score': precedent_data['similarity'],
                    'was_followed': precedent_data['aligned'],
                    'divergence_reason': precedent_data.get('divergence_reason', '')
                }
            )
        
        return {
            "consistency_score": score,
            "recommendation": recommendation,
            "precedents_found": len(similar_judgments),
            "similar_cases": consistency_metrics['precedents'],
            "divergence_flags": consistency_metrics['divergence_flags']
        }
    
    @staticmethod
    def _find_similar_judgments(judgment: Judgment) -> list:
        """
        Find historically similar judgments using AI Semantic Search.
        Delegates to PrecedentSearchService.
        """
        from .precedent_search_service import PrecedentSearchService
        
        # Use Sovereign Vector Search
        results = PrecedentSearchService.find_similar_cases(
            query_judgment=judgment,
            top_k=5,
            min_similarity=0.60 # Allow broader matching for analysis
        )
        
        # Filter out "No Precedent" responses
        valid_results = [r for r in results if 'judgment' in r]
        
        return valid_results
    
    @staticmethod
    def _calculate_similarity(judgment1: Judgment, judgment2: Judgment) -> float:
        """
        Calculate similarity score between two judgments.
        
        Factors (each worth ~0.33):
        1. Same product category
        2. Same verdict type
        3. Similar awarded amount (within 30%)
        """
        score = 0.0
        
        # Factor 1: Product Category
        # 🛡️ DIGITAL FORTRESS: Replaced try-except-pass with safe navigation
        try:
            booking1 = getattr(judgment1.dispute, 'booking', None)
            booking2 = getattr(judgment2.dispute, 'booking', None)
            if booking1 and booking2:
                product1 = getattr(booking1, 'product', None)
                product2 = getattr(booking2, 'product', None)
                if product1 and product2 and product1.category_id == product2.category_id:
                    score += 0.34
        except AttributeError:
            pass # Safe fallback for missing relations

        
        # Factor 2: Verdict Type
        if Judgment.canonical_verdict(judgment1.verdict) == Judgment.canonical_verdict(judgment2.verdict):
            score += 0.33
        
        # Factor 3: Awarded Amount (within 30% range)
        amount1 = float(judgment1.awarded_amount)
        amount2 = float(judgment2.awarded_amount)
        
        if amount1 > 0 and amount2 > 0:
            ratio = min(amount1, amount2) / max(amount1, amount2)
            if ratio >= 0.70:  # Within 30% difference
                score += 0.33
        
        return min(score, 1.0)
    
    @staticmethod
    def _calculate_consistency(judgment: Judgment, similar_judgments: list) -> dict:
        """
        Calculate consistency metrics against similar cases.
        """
        precedents = []
        divergence_flags = []
        total_similarity = 0.0
        
        for item in similar_judgments:
            precedent = item['judgment']
            similarity = item['similarity_score']
            
            # Check alignment: Did we reach the same verdict?
            aligned = (Judgment.canonical_verdict(judgment.verdict) == Judgment.canonical_verdict(precedent.verdict))
            
            precedent_data = {
                'judgment': precedent,
                'similarity': similarity,
                'aligned': aligned,
                'precedent_id': precedent.id,
                'precedent_verdict': precedent.verdict,
                'current_verdict': judgment.verdict,
                'shared_factors': item.get('shared_factors', []),
                'explanation': item.get('explanation', '')
            }
            
            if not aligned:
                # Divergence detected
                divergence_reason = f"Precedent favored '{precedent.verdict}' but current judgment favors '{judgment.verdict}'"
                precedent_data['divergence_reason'] = divergence_reason
                
                divergence_flags.append({
                    'precedent_id': precedent.id,
                    'reason': divergence_reason,
                    'similarity': similarity
                })
            
            precedents.append(precedent_data)
            total_similarity += similarity
        
        average_similarity = total_similarity / len(similar_judgments) if similar_judgments else 0.0
        
        return {
            'average_similarity': average_similarity,
            'precedents': precedents,
            'divergence_flags': divergence_flags
        }
    
    @staticmethod
    def log_consistency_report(judgment: Judgment, report: dict):
        """
        Log the consistency evaluation in EvidenceLog.
        
        User Feedback: Transparency over enforcement.
        """
        EvidenceLog.objects.create(
            action=f"CONSISTENCY_CHECK: {report['recommendation']}",
            actor=None,  # System action
            booking=judgment.dispute.booking,
            dispute=judgment.dispute,
            metadata={
                "judgment_id": judgment.id,
                "consistency_score": report['consistency_score'],
                "recommendation": report['recommendation'],
                "precedents_found": report['precedents_found'],
                "divergence_flags": report.get('divergence_flags', [])
            },
            context_snapshot={
                "consistency_engine_version": "v1.0",
                "baseline_judgments": Judgment.objects.filter(status='final').count()
            }
        )
