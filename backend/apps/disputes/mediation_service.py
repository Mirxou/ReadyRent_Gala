from django.utils import timezone
from django.db.models import Avg
from datetime import timedelta
from decimal import Decimal
import logging
from .models import MediationSession, SettlementOffer, Judgment, Dispute

logger = logging.getLogger(__name__)

class MediationService:
    """
    Phase 40: Sovereign Mediation.
    Calculates "Fair Value" for disputes based on institutional memory (Precedents).
    """

    @staticmethod
    def start_mediation(dispute: Dispute):
        """
        Initializes a mediation session and generates the first system offer.
        """
        if hasattr(dispute, 'mediation_session'):
            return dispute.mediation_session

        session = MediationSession.objects.create(
            dispute=dispute,
            expires_at=timezone.now() + timedelta(days=3) # 3 day window
        )
        
        # Generate initial offer
        MediationService.generate_system_proposal(session)
        
        return session

    @staticmethod
    def generate_system_proposal(session: MediationSession):
        """
        Analyzes similar judgments to propose a fair settlement.
        Uses PrecedentSearchService (Vector Search).
        """
        dispute = session.dispute
        booking = dispute.booking
        
        if not booking:
            logger.warning("No booking associated with dispute. Cannot estimate fair value.")
            return None

        # 1. Cosmic Vector Search (Phase 41)
        # We query the collective memory of the jurisdiction to find the "Fair Value".
        from .precedent_search_service import PrecedentSearchService
        from .explainability_helper import ExplainabilityHelper  # Phase 43 (Placeholder/Simulated)
        
        search_text = f"{dispute.title} {dispute.description}"
        if booking.product and booking.product.category:
            search_text += f" Category: {booking.product.category.name}"
            
        similar_cases = PrecedentSearchService.find_similar_by_text(
            query_text=search_text,
            top_k=5,
            min_similarity=0.60
        )
        
        suggested_amount = Decimal('0.00')
        cited_judgments = []
        is_fallback = False
        reasoning_text = "Analysis based on similar cases."
        confidence = "LOW"
        
        # Filter valid cases
        valid_cases = []
        if isinstance(similar_cases, list) and len(similar_cases) > 0 and 'judgment' in similar_cases[0]:
            valid_cases = [c for c in similar_cases if c.get('judgment') and c['judgment'].awarded_amount is not None]
            
        if valid_cases:
            # Algorithm: Similarity-Weighted Average Ratio
            # We calculate the RATIO of Awarded / Total Price for similar cases
            total_ratio = Decimal('0.0')
            total_weight = Decimal('0.0')
            
            for case in valid_cases:
                similarity = Decimal(str(case['similarity_score']))
                weight = similarity * similarity # Square it
                
                judgment = case['judgment']
                # Calculate ratio: Awarded / Original Claim (or Booking Total if claim missing)
                # Ideally we want ratio against CLAIM, but precedents might not have claims recorded?
                # Let's use Booking Total as the denominator for precedents as a proxy for "Stake"
                # OR use the 'Awarded Ratio' if `PrecedentSearchService` calculated it.
                
                # Let's assume Precedent judgment awarded amount is absolute.
                # We need to map it to current dispute.
                # Best approach: Calculate ratio of Awarded vs Booking Price in precedent.
                # Apply that ratio to CURRENT Booking Price.
                
                prec_booking_price = judgment.dispute.booking.total_price if judgment.dispute.booking else Decimal('1.0')
                if prec_booking_price <= 0: prec_booking_price = Decimal('1.0')
                
                ratio = judgment.awarded_amount / prec_booking_price
                
                total_ratio += ratio * weight
                total_weight += weight
                cited_judgments.append(judgment)
                
            if total_weight > 0:
                avg_ratio = total_ratio / total_weight
                # Cap ratio at 1.0 (100%)
                if avg_ratio > 1.0: avg_ratio = Decimal('1.0')
                
                # Apply ratio to CURRENT booking/claim
                # If we have claimed_amount, use it as the ceiling or reference? 
                # Actually, standard is usually Refund % of Total Price.
                base_amount = booking.total_price
                if dispute.claimed_amount and dispute.claimed_amount < base_amount:
                     base_amount = dispute.claimed_amount
                
                suggested_amount = base_amount * avg_ratio
                suggested_amount = suggested_amount.quantize(Decimal('0.01'))
                
                confidence = valid_cases[0]['confidence']
                reasoning_text = f"Found {len(valid_cases)} similar precedents with average award ratio of {avg_ratio*100:.1f}%. Top match: {valid_cases[0]['judgment'].verdict}."
                
            else:
                 is_fallback = True
        else:
            is_fallback = True
            
        if is_fallback:
             # Default: 50% split if no precedents (Equity)
             # Or 0 if risk is low? Let's be benevolent: 50% of CLAIM if exists, else 50% of Booking.
             base = dispute.claimed_amount if dispute.claimed_amount else booking.total_price
             suggested_amount = base / 2
             suggested_amount = suggested_amount.quantize(Decimal('0.01'))
             reasoning_text = "No sufficient precedents found. Proposing equitable split (50%)."

        # 2. Create Offer
        # Phase 44: System offers are PENDING_REVIEW by default (Human-in-the-loop)
        # For Phase 4 we make them VISIBLE immediately for verified automation unless extremely high value
        status = SettlementOffer.Status.VISIBLE
        if suggested_amount > Decimal('5000.00'):
             status = SettlementOffer.Status.PENDING_REVIEW
             
        offer = SettlementOffer.objects.create(
            session=session,
            source='system',
            amount=suggested_amount,
            reasoning=reasoning_text,
            is_accepted=False,
            status=status
        )
        
        # Link precedents
        if cited_judgments:
            offer.cited_precedents.set(cited_judgments)
            
        logger.info(f"Generated system offer for Dispute #{dispute.id}: {suggested_amount}")
        return offer

    @staticmethod
    def accept_offer(offer: SettlementOffer):
        """
        Parties accepted the offer. Close dispute and trigger restitution.
        """
        session = offer.session
        dispute = session.dispute
        
        offer.is_accepted = True
        offer.save()
        
        session.status = 'accepted'
        session.save()
        
        # Update Dispute Status
        dispute.status = 'closed'
        dispute.resolution = f"Settled via Mediation. Agreed Amount: {offer.amount}"
        dispute.resolved_at = timezone.now()
        dispute.save()
        
        # Trigger Restitution via Engine (Phase 3)
        try:
            from apps.payments.models import EscrowHold
            from apps.payments.engine import EscrowEngine
            from apps.payments.states import EscrowState
            from apps.payments.context import EscrowEngineContext
            
            escrow_hold = EscrowHold.objects.get(booking=dispute.booking)
            
            # Analyze Settlement Type
            is_full_release = (offer.amount >= dispute.booking.total_price)
            is_full_refund = (offer.amount == 0)
            
            with EscrowEngineContext.activate():
                if is_full_release:
                    EscrowEngine.transition(
                        hold_id=escrow_hold.id,
                        target_state=EscrowState.RELEASED,
                        reason=f"Mediation Settled: Full Release ({offer.amount})",
                        actor=None # System
                    )
                elif is_full_refund:
                    EscrowEngine.transition(
                        hold_id=escrow_hold.id,
                        target_state=EscrowState.REFUNDED,
                        reason=f"Mediation Settled: Full Refund",
                        actor=None # System
                    )
                else:
                    # Partial / Split
                    logger.error(
                        f"Mediation Offer {offer.amount} is PARTIAL. Phase 3 Engine requires Binary Resolution. "
                        "Manual Intervention Required."
                    )
                    # We do not transition state.
                    
        except Exception as e:
            logger.error(f"Failed to execute Mediation Settlement for Dispute #{dispute.id}: {e}")
            raise e

        logger.info(f"Mediation accepted for Dispute #{dispute.id}. Settlement: {offer.amount}")
        return True

    @staticmethod
    def reject_offer(offer: SettlementOffer):
        """
        Parties rejected the offer. Move to next round or fail mediation.
        """
        session = offer.session
        dispute = session.dispute
        
        offer.is_accepted = False
        offer.save()
        
        # Check rounds
        if session.current_round < session.max_rounds:
            session.current_round += 1
            session.save()
            
            # Generate new counter-offer (System AI)
            # In a real system, this would be smarter. 
            # For now, we generate a new proposal which might interpret the rejection.
            MediationService.generate_system_proposal(session)
            
            logger.info(f"Offer rejected for Dispute #{dispute.id}. Moving to round {session.current_round}.")
            return {"status": "continued", "round": session.current_round}
        else:
            # Failed Mediation
            session.status = 'expired'
            session.save()
            
            # Return dispute to adjudication queue
            dispute.status = 'under_review' # Back to human/AI judge
            dispute.save()
            
            logger.info(f"Mediation failed for Dispute #{dispute.id}. Rounds exceeded.")
            return {"status": "failed", "message": "Mediation failed. Advancing to Tribunal."}
