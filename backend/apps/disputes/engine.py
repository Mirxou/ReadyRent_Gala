
from django.db import transaction
from django.utils import timezone
from .models import Dispute, EvidenceLog, JudicialPanel, Judgment
from apps.bookings.models import Booking
from .services import DisputeService, PrecedentSearchService
from sovereignty.visual_assets import VisualAssetsBuilder

class TribunalEngine:
    """
    The Cortex of Digital Justice.
    Coordinates admissibility, precedence, and routing.
    """

    @staticmethod
    def process_initiation(user, merit_score, emotional_state, request_data):
        """
        Coordinates the initiation of a sovereign dispute.
        Returns a dict compliant with SOVEREIGN_API_SPEC.
        """
        from .expectation_setter import ExpectationSetter
        
        # 1. Behavioral Check (Ethics as Data Persistence)
        now = timezone.now()
        
        # Check if user is currently under a judicial lock
        if user.emotional_lock_until and user.emotional_lock_until > now:
            return TribunalEngine._cooling_off_response("LOCKED", user.emotional_lock_until)

        with transaction.atomic():
            user.last_dispute_attempt_at = now
            
            if emotional_state == "angry":
                # Apply procedural friction (2 hour lock)
                lock_duration = timezone.timedelta(hours=2)
                user.emotional_lock_until = now + lock_duration
                user.consecutive_emotional_attempts += 1
                user.save(update_fields=['emotional_lock_until', 'last_dispute_attempt_at', 'consecutive_emotional_attempts'])
                
                # LOG: Behavioral Halt (The Black Box)
                EvidenceLog.objects.create(
                    action="BEHAVIORAL_HALT",
                    actor=user,
                    metadata={"reason": "Emotional Flooding", "lock_until": user.emotional_lock_until.isoformat()}
                )
                
                return TribunalEngine._cooling_off_response("NEW", user.emotional_lock_until)
            
            # Graceful Return: Reset emotional attempts if they are calm
            if user.consecutive_emotional_attempts > 0:
                user.consecutive_emotional_attempts = 0
                user.save(update_fields=['consecutive_emotional_attempts'])

            # 2. Context Discovery (Booking Lookup)
            booking_id = request_data.get('booking_id')
            booking = None
            if booking_id:
                try:
                    booking = Booking.objects.get(id=booking_id)
                except Booking.DoesNotExist:
                    pass

            # 3. Permanent Dispute Creation (Transition from Mock to Real)
            dispute = Dispute.objects.create(
                user=user,
                booking=booking,
                title=request_data.get('title', 'UNAFFILIATED_DISPUTE'),
                description=request_data.get('description', ''),
                priority=request_data.get('priority', 'medium')
            )
            
            # LOG: Dispute Created (The Black Box)
            EvidenceLog.objects.create(
                action="DISPUTE_INITIATED",
                actor=user,
                dispute=dispute,
                booking=booking,
                metadata={"priority": dispute.priority, "context": "Phase 32 Tribunal Engine"}
            )

            # 4. Admissibility Gate (Procedural Scrutiny)
            is_admissible = DisputeService.evaluate_admissibility(dispute)
            
            if not is_admissible:
                return TribunalEngine._structured_form_response(dispute)

            # 4. Precedent Discovery (AI Bailiff)
            precedents = TribunalEngine._find_initial_precedents(dispute)

            # 5. Panel Routing
            panel = TribunalEngine._route_to_panel(dispute)
            if panel:
                dispute.assigned_to = panel.members.first()
                dispute.save()
                panel.assign_case()
                
                # LOG: Panel Assigned
                EvidenceLog.objects.create(
                    action="PANEL_ASSIGNED",
                    actor=None, # System Action
                    dispute=dispute,
                    booking=booking,
                    metadata={"panel_name": panel.name, "capacity_load": panel.current_load}
                )

            # 6. Final Sovereign Response
            assets = VisualAssetsBuilder.for_proceeding(dispute_id=str(dispute.id))
            
            return {
                "status": "sovereign_proceeding",
                "dignity_preserved": True,
                "code": "JUDICIAL_PROCESS_INITIATED",
                "dispute_id": dispute.id,
                "phase": "JUDICIAL_REVIEW",
                "estimated_wait": "PROTECTIVE_48_HOURS",
                "precedents_found": len(precedents),
                "assigned_panel": panel.name if panel else "GENERAL_POOL",
                "visual_assets": assets
            }

    @staticmethod
    def _find_initial_precedents(dispute):
        """Uses PrecedentSearchService to find similar cases."""
        try:
            # Phase 41: Sovereign Wiring (Weak Coupling)
            # Using text-based vector search since the dispute is new (no judgment yet)
            search_text = f"{dispute.title} {dispute.description}"
            if dispute.booking and dispute.booking.product and dispute.booking.product.category:
                search_text += f" Category: {dispute.booking.product.category.name}"
            
            # Find semantically similar past judgments
            # We use a lower consistency threshold (0.5) for initial discovery
            precedents = PrecedentSearchService.find_similar_by_text(
                query_text=search_text,
                top_k=5,
                min_similarity=0.5
            )
            return precedents
        except Exception as e:
            # Fallback: Return empty list if vector search fails (Resilience)
            # In production, we would log this error strictly via EvidenceLog.
            return []

    @staticmethod
    def _route_to_panel(dispute):
        """Identifies the best panel based on load and category."""
        # Simplified routing: find active panel with capacity
        panel = JudicialPanel.objects.filter(is_active=True).order_by('current_load').first()
        if panel and panel.has_capacity():
            return panel
        return None

    @staticmethod
    def _cooling_off_response(dispute_id, unlock_time=None):
        if not unlock_time:
            unlock_time = (timezone.now() + timezone.timedelta(hours=2))
            
        unlock_time_iso = unlock_time.isoformat()
        assets = VisualAssetsBuilder.for_cooling_off(dispute_id=dispute_id, unlock_time=unlock_time_iso)
        return {
            "status": "sovereign_halt",
            "dignity_preserved": True,
            "code": "DIGNITY_COOLING_OFF",
            "verdict": {
                "title_ar": "هدنة مؤقتة",
                "title_en": "Temporary Pause",
                "body_ar": "النظام يفرض فترة انتظار لحماية جودة القرار.",
                "body_en": "The system mandates a waiting period to ensure quality of decision.",
                "unlocks_at": unlock_time
            },
            "visual_assets": assets
        }

    @staticmethod
    def _structured_form_response(dispute):
        assets = VisualAssetsBuilder.for_conditional(dispute_id=str(dispute.id))
        return {
            "status": "sovereign_conditional",
            "dignity_preserved": True,
            "code": "STRUCTURED_FORM_REQUIRED",
            "reason": dispute.inadmissible_reason,
            "requirements": [
                { "type": "document", "min_count": 2, "description": "إثبات واقعة" }
            ],
            "visual_assets": assets
        }
