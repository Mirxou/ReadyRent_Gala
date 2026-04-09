from ..models import Appeal, Judgment, JudgmentPrecedent, EvidenceLog
from .consistency_service import ConsistencyService

class AppealService:
    """
    The Merit Evaluator.
    Scores appeals to route them appropriately without gatekeeping.
    
    User Feedback Integration:
    - Merit indicates, never dictates
    - Human-explainable factors
    - Low merit ≠ Denial (just needs review)
    """
    
    # Merit Thresholds
    HIGH_MERIT = 80  # Auto High Court
    MEDIUM_MERIT = 50  # Panel review
    
    @staticmethod
    def evaluate_appeal_merit(appeal: Appeal) -> dict:
        """
        Evaluate appeal merit to determine appropriate judicial attention.
        
        Returns:
            dict: {
                "merit_score": int (0-100),
                "recommendation": str,
                "factors": dict,  # Human-readable breakdown
                "explanation": str
            }
        """
        judgment = appeal.judgment
        dispute = judgment.dispute
        
        merit_score = 0
        factors = {}
        
        # Factor 1: New Evidence (+40 points)
        # Check if appeal provides substantive new information
        has_new_evidence = AppealService._check_new_evidence(appeal)
        if has_new_evidence:
            merit_score += 40
            factors['new_evidence'] = {
                'points': 40,
                'status': 'YES',
                'explanation': 'Appellant presents evidence not available during original judgment'
            }
        else:
            factors['new_evidence'] = {
                'points': 0,
                'status': 'NO',
                'explanation': 'No substantive new evidence presented'
            }
        
        # Factor 2: Procedural Error (+30 points)
        # Check if there was a clear procedural violation
        procedural_error = AppealService._check_procedural_error(appeal, judgment)
        if procedural_error:
            merit_score += 30
            factors['procedural_error'] = {
                'points': 30,
                'status': 'YES',
                'explanation': 'Potential violation of judicial procedure identified'
            }
        else:
            factors['procedural_error'] = {
                'points': 0,
                'status': 'NO',
                'explanation': 'No procedural violations detected'
            }
        
        # Factor 3: Precedent Divergence (+20 points)
        # Check if this judgment contradicts established precedents
        divergence_score = AppealService._check_precedent_divergence(judgment)
        if divergence_score > 0:
            merit_score += divergence_score
            factors['precedent_divergence'] = {
                'points': divergence_score,
                'status': 'YES' if divergence_score >= 15 else 'MODERATE',
                'explanation': f'Judgment diverges from {divergence_score}% of similar precedents'
            }
        else:
            factors['precedent_divergence'] = {
                'points': 0,
                'status': 'NO',
                'explanation': 'Judgment aligns with historical precedents'
            }
        
        # Factor 4: Appellant History (-20 points penalty)
        # Check for frivolous appeal pattern
        frivolous_history = AppealService._check_appellant_history(appeal.appellant)
        if frivolous_history:
            merit_score -= 20
            factors['appellant_history'] = {
                'points': -20,
                'status': 'NEGATIVE',
                'explanation': 'Appellant has history of rejected appeals'
            }
        else:
            factors['appellant_history'] = {
                'points': 0,
                'status': 'CLEAN',
                'explanation': 'No concerning appeal history'
            }
        
        # Factor 5: Stakes (+10 points)
        # High financial or systemic importance
        high_stakes = AppealService._check_stakes(judgment)
        if high_stakes:
            merit_score += 10
            factors['stakes'] = {
                'points': 10,
                'status': 'HIGH',
                'explanation': 'Significant financial impact or systemic importance'
            }
        else:
            factors['stakes'] = {
                'points': 0,
                'status': 'STANDARD',
                'explanation': 'Standard case scope'
            }
        
        # Ensure score stays in 0-100 range
        merit_score = max(0, min(100, merit_score))
        
        # Generate Recommendation
        if merit_score >= AppealService.HIGH_MERIT:
            recommendation = "HIGH_COURT_REVIEW"
            explanation = "Strong merit indicators warrant High Court attention"
        elif merit_score >= AppealService.MEDIUM_MERIT:
            recommendation = "PANEL_REVIEW"
            explanation = "Moderate merit - suitable for specialized panel"
        else:
            recommendation = "PRELIMINARY_REVIEW"
            explanation = "Requires initial review before panel assignment"
        
        return {
            "merit_score": merit_score,
            "recommendation": recommendation,
            "factors": factors,
            "explanation": explanation
        }
    
    @staticmethod
    def _check_new_evidence(appeal: Appeal) -> bool:
        """
        Check if appeal presents new evidence.
        Currently simplified - checks if reason mentions new evidence.
        """
        keywords = ['new evidence', 'additional proof', 'discovered', 'previously unavailable']
        reason_lower = appeal.reason.lower()
        return any(keyword in reason_lower for keyword in keywords)
    
    @staticmethod
    def _check_procedural_error(appeal: Appeal, judgment: Judgment) -> bool:
        """
        Check for procedural violations.
        Simplified: checks if appeal mentions procedure issues.
        """
        keywords = ['procedure', 'process violation', 'unfair hearing', 'rushed judgment']
        reason_lower = appeal.reason.lower()
        return any(keyword in reason_lower for keyword in keywords)
    
    @staticmethod
    def _check_precedent_divergence(judgment: Judgment) -> int:
        """
        Check if judgment diverges from precedents.
        Returns divergence percentage (0-20 points).
        """
        # Get precedents linked to this judgment
        precedents = JudgmentPrecedent.objects.filter(judgment=judgment)
        
        if not precedents.exists():
            return 0  # No precedents to diverge from
        
        # Count how many precedents were NOT followed
        total = precedents.count()
        divergent = precedents.filter(was_followed=False).count()
        
        if divergent == 0:
            return 0
        
        # Calculate divergence percentage, scale to 0-20 points
        divergence_ratio = divergent / total
        return int(divergence_ratio * 20)
    
    @staticmethod
    def _check_appellant_history(appellant) -> bool:
        """
        Check if appellant has frivolous appeal history.
        Simplified: checks if they have 2+ rejected appeals.
        """
        rejected_appeals = Appeal.objects.filter(
            appellant=appellant,
            status='rejected'
        ).count()
        
        return rejected_appeals >= 2
    
    @staticmethod
    def _check_stakes(judgment: Judgment) -> bool:
        """
        Check if case has high stakes.
        High stakes = awarded amount > 500 or systemic flag.
        """
        return float(judgment.awarded_amount) > 500.00
    
    @staticmethod
    def log_merit_evaluation(appeal: Appeal, merit_report: dict):
        """
        Log merit evaluation to EvidenceLog for transparency.
        
        User Feedback: Explainability over automation.
        """
        EvidenceLog.objects.create(
            action=f"APPEAL_MERIT_EVALUATED: {merit_report['recommendation']}",
            actor=None,  # System action
            booking=appeal.judgment.dispute.booking,
            dispute=appeal.judgment.dispute,
            metadata={
                "appeal_id": appeal.id,
                "merit_score": merit_report['merit_score'],
                "recommendation": merit_report['recommendation'],
                "factors": merit_report['factors']
            },
            context_snapshot={
                "merit_engine_version": "v1.0",
                "evaluation_explanation": merit_report['explanation']
            }
        )
    
    @staticmethod
    def route_to_panel(appeal: Appeal, merit_report: dict) -> dict:
        """
        Route appeal to appropriate judicial panel based on merit score.
        
        User Feedback Integration:
        - Capacity-aware routing
        - Automatic overflow escalation
        - Panel type matching (damage, timeliness, etc.)
        
        Returns:
            dict: {
                "panel": JudicialPanel or None,
                "routing_decision": str,
                "reason": str
            }
        """
        from ..models import JudicialPanel
        from django.db import models
        
        merit_score = merit_report['merit_score']
        recommendation = merit_report['recommendation']
        
        # High Merit (80+) → High Court
        if recommendation == 'HIGH_COURT_REVIEW':
            # Find High Court panel
            high_court = JudicialPanel.objects.filter(
                panel_type='high_court',
                is_active=True
            ).first()
            
            if high_court and high_court.has_capacity():
                return {
                    "panel": high_court,
                    "routing_decision": "HIGH_COURT",
                    "reason": f"High merit ({merit_score}/100) warrants High Court review"
                }
            else:
                # High Court at capacity - still assign but flag overflow
                return {
                    "panel": high_court,
                    "routing_decision": "HIGH_COURT_OVERFLOW",
                    "reason": "High Court at capacity - case flagged for priority queue"
                }
        
        # Medium Merit (50-79) → Specialized Panel
        elif recommendation == 'PANEL_REVIEW':
            # Determine panel type based on dispute category
            panel = AppealService._match_specialized_panel(appeal)
            
            if panel and panel.has_capacity():
                return {
                    "panel": panel,
                    "routing_decision": "SPECIALIZED_PANEL",
                    "reason": f"Moderate merit ({merit_score}/100) - routed to {panel.name}"
                }
            else:
                # Panel at capacity - escalate to High Court
                high_court = JudicialPanel.objects.filter(
                    panel_type='high_court',
                    is_active=True
                ).first()
                
                return {
                    "panel": high_court,
                    "routing_decision": "ESCALATED_TO_HIGH_COURT",
                    "reason": "Specialized panel at capacity - escalated to High Court"
                }
        
        # Low Merit (0-49) → Preliminary Review (no panel assignment yet)
        else:
            return {
                "panel": None,
                "routing_decision": "PRELIMINARY_REVIEW",
                "reason": f"Requires initial review ({merit_score}/100) before panel assignment"
            }
    
    @staticmethod
    def _match_specialized_panel(appeal: Appeal):
        """
        Match appeal to appropriate specialized panel based on dispute type.
        """
        from ..models import JudicialPanel
        from django.db import models
        
        dispute = appeal.judgment.dispute
        dispute_title = dispute.title.lower()
        
        # Simple keyword matching (can be enhanced later)
        if 'damage' in dispute_title or 'broken' in dispute_title:
            panel = JudicialPanel.objects.filter(
                name__icontains='damage',
                is_active=True
            ).first()
            if panel:
                return panel
        
        if 'late' in dispute_title or 'delay' in dispute_title:
            panel = JudicialPanel.objects.filter(
                name__icontains='timeliness',
                is_active=True
            ).first()
            if panel:
                return panel
        
        # Default: return first available routine panel
        return JudicialPanel.objects.filter(
            panel_type='routine',
            is_active=True,
            current_load__lt=models.F('max_cases_per_week')
        ).first()
