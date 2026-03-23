from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from apps.disputes.models import Dispute, EvidenceLog

class DisputeService:
    """
    The Tribunal's Clerk.
    Handles the procedural aspects of disputes, including Admissibility Checks.
    """

    @staticmethod
    def evaluate_admissibility(dispute: Dispute) -> bool:
        """
        The Admissibility Gate.
        Determines if a filed dispute passes the basic checks to proceed to Discovery.
        
        Criteria:
        1. Cooling-off period: Must be within 24h of Booking End (Simulated rule).
        2. Evidence Check: Must have at least one EvidenceLog associated (Proof of interaction).
        """
        report = {
            "checks": [],
            "result": "PENDING"
        }
        is_admissible = True
        rejections = []

        # 1. Timeline Check (Cooling Off / Statute of Limitations)
        # Rule: Dispute must be filed within 7 days of booking end.
        booking = dispute.booking
        if booking:
            limit = booking.end_date + timedelta(days=7)
            # Convert date to datetime for comparison, assuming EOD
            limit_dt = timezone.make_aware(timezone.datetime.combine(limit, timezone.datetime.max.time()))
            
            if timezone.now() > limit_dt:
                is_admissible = False
                rejections.append("Statute of Limitations Expired (> 7 days after booking).")
                report["checks"].append({"check": "Timeline", "status": "FAIL", "detail": "Filed too late."})
            else:
                report["checks"].append({"check": "Timeline", "status": "PASS", "detail": "Within legal window."})
        else:
             report["checks"].append({"check": "Timeline", "status": "WARN", "detail": "No Booking linked."})

        # 2. Evidence Check
        # Rule: Must have evidence logs (system interactions).
        evidence_count = EvidenceLog.objects.filter(booking=booking).count()
        if evidence_count == 0:
            # We might allow it but flag it as weak
            report["checks"].append({"check": "Evidence Trail", "status": "WEAK", "detail": "No automated evidence found."})
        else:
            report["checks"].append({"check": "Evidence Trail", "status": "PASS", "detail": f"{evidence_count} logs found."})

        # Final Verdict
        if is_admissible:
            dispute.status = 'admissible'
            report["result"] = "ADMISSIBLE"
        else:
            dispute.status = 'inadmissible'
            dispute.inadmissible_reason = "; ".join(rejections)
            report["result"] = "INADMISSIBLE"

        dispute.admissibility_report = report
        dispute.save()
        
        # Log the Gate Decision
        EvidenceLog.objects.create(
            action=f"ADMISSIBILITY_VERDICT: {report['result']}",
            actor=dispute.user, # Or system user
            dispute=dispute,
            booking=dispute.booking,
            metadata={"report": report},
            context_snapshot={"gate_version": "v1.0"}
        )

        return is_admissible

    @staticmethod
    def suggest_clauses(dispute: Dispute) -> dict:
        """
        The AI Bailiff.
        Reads the Case File and suggests relevant Smart Agreement clauses.
        CRITICAL: These are NON-BINDING suggestions. The AI prepares, it does not judge.
        """
        suggestions = []
        
        # simulated logic - in prod this would use vector search on the contract
        description_lower = dispute.description.lower()
        title_lower = dispute.title.lower()
        full_text = f"{title_lower} {description_lower}"

        # 1. Damage Logic
        if any(word in full_text for word in ['broken', 'damaged', 'scratch', 'crack']):
            suggestions.append({
                "clause_id": "CLAUSE_7_DAMAGE",
                "title": "Material Damage Liability",
                "text": "The Renter is liable for any material damage incurred during the rental period...",
                "confidence": 0.85, # High confidence
                "relevance": "Detected keywords related to physical damage."
            })

        # 2. Late Return Logic
        if any(word in full_text for word in ['late', 'delayed', 'time', 'overdue']):
            suggestions.append({
                "clause_id": "CLAUSE_4_LATE_FEES",
                "title": "Late Return Penalty",
                "text": "Returns delayed by more than 2 hours incur a penalty of...",
                "confidence": 0.92,
                "relevance": "Detected keywords related to time/lateness."
            })

        # 3. Cleanliness Logic
        if any(word in full_text for word in ['dirty', 'stain', 'mess', 'clean']):
            suggestions.append({
                "clause_id": "CLAUSE_9_HYGIENE",
                "title": "Hygiene & Cleaning Standards",
                "text": "Items must be returned in the same sanitary condition...",
                "confidence": 0.78,
                "relevance": "Detected keywords related to cleanliness."
            })

        result = {
            "is_binding": False, # CORE PHILOSOPHY
            "bailiff_note": "These clauses are suggested for review by the human arbiter.",
            "suggestions": suggestions
        }
        
        return result

    @staticmethod
    def process_appeal(appeal, decision: str, judge, review_notes: str = "") -> dict:
        """
        The High Court Review.
        Processes an appeal with three possible outcomes: UPHOLD, OVERTURN, or REMAND.
        
        User Feedback Integration:
        - Freeze during appeal (is_fund_frozen)
        - Graph Node logic (new Judgment for OVERTURN)
        - Closure after rejection (prevents rage appeals)
        """
        from apps.disputes.models import Judgment, Appeal, EvidenceLog
        
        if appeal.status != 'pending':
            return {"error": "Appeal is not pending review."}
        
        judgment = appeal.judgment
        result = {"action": decision, "previous_judgment": judgment.id}
        
        with transaction.atomic():
            if decision == "UPHOLD":
                # Finalize the original judgment
                judgment.status = 'final'
                judgment.finalized_at = timezone.now()
                judgment.save()
                
                appeal.status = 'rejected'
                appeal.reviewed_by = judge
                appeal.review_notes = review_notes or "High Court upheld the original verdict."
                appeal.is_fund_frozen = False  # Un freeze for execution
                appeal.save()
                
                result["final_judgment"] = judgment.id
                result["message"] = "Appeal rejected. Original judgment is now FINAL."
                
            elif decision == "OVERTURN":
                # Void the original judgment
                judgment.status = 'overturned'
                judgment.save()
                
                appeal.status = 'granted'
                appeal.reviewed_by = judge
                appeal.review_notes = review_notes or "High Court found the judgment flawed."
                appeal.is_fund_frozen = False
                appeal.save()
                
                # NOTE: High Court does NOT create a new judgment automatically.
                # That must be done by the Tribunal after receiving the mandate.
                result["message"] = "Appeal granted. Original judgment OVERTURNED. Case returned."
                
            elif decision == "REMAND":
                # Send back to Tribunal for re-examination
                appeal.status = 'remanded'
                appeal.reviewed_by = judge
                appeal.review_notes = review_notes or "Insufficient evidence. Remanded for further review."
                appeal.save()
                
                # Judgment stays provisional
                result["message"] = "Case remanded to Tribunal for additional proceedings."
                
            else:
                return {"error": f"Invalid decision: {decision}"}
            
            # Log the High Court Decision
            EvidenceLog.objects.create(
                action=f"HIGH_COURT_DECISION: {decision}",
                actor=judge,
                dispute=judgment.dispute,
                booking=judgment.dispute.booking,
                metadata={"appeal_id": appeal.id, "decision": decision, "notes": review_notes},
                context_snapshot={"court_version": "v1.0"}
            )
        
        return result


class DisputeRouter:
    """
    The Sovereign Dispatcher.
    Routes disputes to the appropriate Judicial Panel based on Sovereign Policy and Capacity.
    """
    
    @staticmethod
    def route(dispute: Dispute):
        """
        Assigns the dispute to a Judicial Panel.
        """
        from apps.disputes.models import JudicialPanel, EvidenceLog
        from standard_core.engine import SovereignEngine
        # from django.db.models import F # Not used yet
        
        # 1. Determine Policy
        category_name = None
        if dispute.booking and dispute.booking.product and dispute.booking.product.category:
            category_name = dispute.booking.product.category.name

        target_type = SovereignEngine.get_routing_policy(
            priority=dispute.priority,
            category=category_name 
        )
        
        # 2. Find Best Panel (Load Balancing)
        # Strategy: Least Loaded Active Panel of correct type
        panel = JudicialPanel.objects.filter(
            panel_type=target_type,
            is_active=True
        ).order_by('current_load').first()
        
        if not panel:
            # Fallback to any routine panel
            if target_type != 'routine':
                panel = JudicialPanel.objects.filter(
                    panel_type='routine',
                    is_active=True
                ).order_by('current_load').first()
        
        if panel:
            # 3. Assign
            dispute.judicial_panel = panel
            dispute.save()
            
            # Update Panel Load
            panel.assign_case()
            
            # 4. Log
            EvidenceLog.objects.create(
                action=f"DISPUTE_ROUTED: {panel.name}",
                actor=None, # System
                dispute=dispute,
                booking=dispute.booking,
                metadata={
                    "panel_id": panel.id,
                    "panel_type": panel.panel_type,
                    "load_after": panel.current_load
                },
                context_snapshot={"router_version": "v1.0"}
            )
            return True
            
        else:
            # Critical Failure: No Panels!
            EvidenceLog.objects.create(
                action="ROUTING_FAILED",
                dispute=dispute,
                metadata={"reason": "No active panels found"},
                context_snapshot={"target_type": target_type}
            )
            return False
