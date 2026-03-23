
from django.db.models import Sum
from .models import Dispute, Judgment, SettlementOffer, EvidenceLog, MediationSession

class ArchitecturalFusion:
    """
    The Consistency Engine (Phase 45).
    Ensures that the 'Soul' (AI Logic) and 'Body' (Database State) are in sync.
    """
    
    @staticmethod
    def ensure_consistency(dispute_id: int) -> dict:
        """
        Runs a battery of sanity checks on a specific dispute.
        Returns a report of any anomalies.
        """
        # Default report structure
        report = {
            'dispute_id': dispute_id,
            'status': 'HEALTHY',
            'anomalies': []
        }
        
        try:
            dispute = Dispute.objects.select_related('booking').get(id=dispute_id)
        except Dispute.DoesNotExist:
            return {'status': 'ERROR', 'anomalies': ['Dispute not found']}

        # CHECK 1: Offer Integrity (No infinite money glitch)
        offers = SettlementOffer.objects.filter(session__dispute=dispute)
        booking_val = dispute.booking.total_price if dispute.booking else 0
        max_allowed = booking_val * 3 if booking_val else 100000 
        
        for offer in offers:
            if offer.amount > max_allowed:
                report['anomalies'].append(
                    f"Offer #{offer.id} amount ({offer.amount}) exceeds safety cap ({max_allowed})"
                )
                if report['status'] == 'HEALTHY': report['status'] = 'COMPROMISED'

        # CHECK 2: State Congruence
        if hasattr(dispute, 'mediation_session'):
            if dispute.mediation_session.status == 'active' and dispute.status == 'closed':
                 report['anomalies'].append("Dispute is CLOSED but Mediation is ACTIVE")
                 if report['status'] == 'HEALTHY': report['status'] = 'INCONSISTENT'

        # CHECK 3: Evidence Log Existence
        # Basic check: if meaningful action, log should exist
        logs = EvidenceLog.objects.filter(dispute=dispute).exists()
        if not logs and dispute.status != 'filed':
             report['anomalies'].append("Dispute active but no EvidenceLog entries found")
             if report['status'] == 'HEALTHY': report['status'] = 'WARNING'
             
        # CHECK 4: Judgment Consistency
        judgments = Judgment.objects.filter(dispute=dispute)
        for j in judgments:
            if j.status == 'final' and dispute.status != 'resolved' and dispute.status != 'closed' and dispute.status != 'appeal_pending':
                report['anomalies'].append(f"Final Judgment #{j.id} exists but Dispute status is {dispute.status}")
                if report['status'] == 'HEALTHY': report['status'] = 'INCONSISTENT'

        return report

    @staticmethod
    def global_health_check() -> list:
        """
        Scans recent active disputes for anomalies.
        """
        active_disputes = Dispute.objects.exclude(status='closed').order_by('-updated_at')[:50]
        results = []
        for dispute in active_disputes:
            res = ArchitecturalFusion.ensure_consistency(dispute.id)
            if res['status'] != 'HEALTHY':
                results.append(res)
        return results
