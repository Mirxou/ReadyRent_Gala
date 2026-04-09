"""
Views for Disputes app
"""

from rest_framework import generics, status, filters, permissions
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
import json
from django.utils import timezone
from django.db.models import Count, Q
from django.http import JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Dispute,
    DisputeMessage,
    SupportTicket,
    TicketMessage,
    Appeal,
    Judgment,
    AnonymizedJudgment,
    PublicMetrics,
    MediationSession,
    SettlementOffer,
    EvidenceLog,
)
from .serializers import (
    DisputeSerializer,
    DisputeMessageSerializer,
    SupportTicketSerializer,
    TicketMessageSerializer,
    TribunalDisputeSerializer,
    AnonymizedJudgmentSerializer,
    PublicMetricsSerializer,
    EvidenceLogSerializer,
    MediationSessionSerializer,
    SettlementOfferSerializer,
    JudgmentSerializer,
    AppealSerializer,
)
from .engine import TribunalEngine


from standard_core.mixins import SovereignResponseMixin


# Dispute Views
class DisputeCreateView(SovereignResponseMixin, generics.CreateAPIView):
    """Create dispute"""

    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]  # CRITICAL: Prevent DoS

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DisputeListView(generics.ListAPIView):
    """List user's disputes"""

    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "priority"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "priority"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Dispute.objects.select_related(
            "user", "booking", "assigned_to", "resolved_by"
        ).prefetch_related("messages")
        # Users can only see their own disputes unless admin
        if self.request.user.role not in ["admin", "staff"]:
            queryset = queryset.filter(user=self.request.user)
        return queryset


class DisputeDetailView(generics.RetrieveUpdateAPIView):
    """Get or update dispute"""

    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Dispute.objects.select_related(
            "user", "booking", "assigned_to", "resolved_by"
        ).prefetch_related("messages")
        # Users can only see their own disputes unless admin
        if self.request.user.role not in ["admin", "staff"]:
            queryset = queryset.filter(user=self.request.user)
        return queryset

    # SOV-1: Valid state transitions to prevent judicial bypass
    VALID_TRANSITIONS = {
        "filed": ["admissible", "inadmissible", "closed"],
        "admissible": ["under_review", "closed"],
        "inadmissible": ["closed"],
        "under_review": ["judgment_provisional", "closed"],
        "judgment_provisional": ["judgment_final", "closed"],
        "judgment_final": ["closed"],
        "closed": [],
    }

    def perform_update(self, serializer):
        instance = self.get_object()
        # Only admin/staff can update status and assign
        if self.request.user.role not in ["admin", "staff"]:
            # Users can only update their own disputes and only description
            if instance.user != self.request.user:
                raise ValidationError("Permission denied")
            allowed_fields = ["description"]
            for field in serializer.validated_data:
                if field not in allowed_fields:
                    raise ValidationError(f"Cannot update {field}")

        # SOV-1: State transition guard — even admin/staff must follow valid transitions
        if "status" in serializer.validated_data:
            new_status = serializer.validated_data["status"]
            allowed = self.VALID_TRANSITIONS.get(instance.status, [])
            if new_status != instance.status and new_status not in allowed:
                raise ValidationError(
                    f"Invalid state transition: {instance.status} → {new_status}. "
                    f"Allowed transitions: {allowed}"
                )

        # Update resolved_at if status changed to resolved
        if "status" in serializer.validated_data:
            if (
                serializer.validated_data["status"] == "resolved"
                and instance.status != "resolved"
            ):
                serializer.validated_data["resolved_at"] = timezone.now()
                serializer.validated_data["resolved_by"] = self.request.user

        serializer.save()


class DisputeMessageCreateView(SovereignResponseMixin, generics.CreateAPIView):
    """Add message to dispute"""

    serializer_class = DisputeMessageSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def perform_create(self, serializer):
        dispute_id = self.request.data.get("dispute")
        try:
            dispute = Dispute.objects.get(pk=dispute_id)
            # Check permissions
            if dispute.user != self.request.user and self.request.user.role not in [
                "admin",
                "staff",
            ]:
                raise ValidationError("Permission denied")
            serializer.save(dispute=dispute, user=self.request.user)
        except Dispute.DoesNotExist:
            raise ValidationError("Dispute not found")


class EvidenceLogView(generics.ListAPIView):
    """
    Get evidence trail for a dispute.
    """

    serializer_class = EvidenceLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        dispute_id = self.kwargs.get("pk")
        dispute = get_object_or_404(Dispute, pk=dispute_id)
        if dispute.user != self.request.user and self.request.user.role not in [
            "admin",
            "staff",
        ]:
            raise ValidationError("Permission denied")
        return EvidenceLog.objects.filter(dispute=dispute)


# Support Ticket Views
class SupportTicketCreateView(generics.CreateAPIView):
    """Create support ticket"""

    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SupportTicketListView(generics.ListAPIView):
    """List support tickets"""

    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "priority", "category"]
    search_fields = ["subject", "description"]
    ordering_fields = ["created_at", "priority"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = SupportTicket.objects.select_related(
            "user", "assigned_to"
        ).prefetch_related("messages")
        # Users can only see their own tickets unless admin
        if self.request.user.role not in ["admin", "staff"]:
            queryset = queryset.filter(user=self.request.user)
        return queryset


class SupportTicketDetailView(generics.RetrieveUpdateAPIView):
    """Get or update support ticket"""

    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = SupportTicket.objects.select_related(
            "user", "assigned_to"
        ).prefetch_related("messages")
        # Users can only see their own tickets unless admin
        if self.request.user.role not in ["admin", "staff"]:
            queryset = queryset.filter(user=self.request.user)
        return queryset

    def perform_update(self, serializer):
        instance = self.get_object()
        # Only admin/staff can update status and assign
        if self.request.user.role not in ["admin", "staff"]:
            # Users can only update their own tickets and only description
            if instance.user != self.request.user:
                raise ValidationError("Permission denied")
            allowed_fields = ["description"]
            for field in serializer.validated_data:
                if field not in allowed_fields:
                    raise ValidationError(f"Cannot update {field}")

        # Update resolved_at if status changed to resolved
        if "status" in serializer.validated_data:
            if (
                serializer.validated_data["status"] == "resolved"
                and instance.status != "resolved"
            ):
                serializer.validated_data["resolved_at"] = timezone.now()

        serializer.save()


class TicketMessageCreateView(generics.CreateAPIView):
    """Add message to ticket"""

    serializer_class = TicketMessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        ticket_id = self.request.data.get("ticket")
        try:
            ticket = SupportTicket.objects.get(pk=ticket_id)
            # Check permissions
            if ticket.user != self.request.user and self.request.user.role not in [
                "admin",
                "staff",
            ]:
                raise ValidationError("Permission denied")
            serializer.save(ticket=ticket, user=self.request.user)
        except SupportTicket.DoesNotExist:
            raise ValidationError("Ticket not found")


# Admin Views
class AdminDisputeStatsView(generics.GenericAPIView):
    """Get dispute statistics (admin only)"""

    permission_classes = [IsAdminUser]

    def get(self, request):
        total_disputes = Dispute.objects.count()
        open_disputes = Dispute.objects.filter(
            status__in=["open", "filed", "admissible"]
        ).count()
        under_review = Dispute.objects.filter(status="under_review").count()
        resolved = Dispute.objects.filter(
            status__in=["resolved", "judgment_final", "closed"]
        ).count()

        priority_breakdown = Dispute.objects.values("priority").annotate(
            count=Count("id")
        )

        stats = {
            "total": total_disputes,
            "open": open_disputes,
            "under_review": under_review,
            "resolved": resolved,
            "priority_breakdown": list(priority_breakdown),
        }

        return Response(stats)


class AdminTicketStatsView(generics.GenericAPIView):
    """Get ticket statistics (admin only)"""

    permission_classes = [IsAdminUser]

    def get(self, request):
        total_tickets = SupportTicket.objects.count()
        open_tickets = SupportTicket.objects.filter(status="open").count()
        in_progress = SupportTicket.objects.filter(status="in_progress").count()
        resolved = SupportTicket.objects.filter(status="resolved").count()

        priority_breakdown = SupportTicket.objects.values("priority").annotate(
            count=Count("id")
        )

        stats = {
            "total": total_tickets,
            "open": open_tickets,
            "in_progress": in_progress,
            "resolved": resolved,
            "priority_breakdown": list(priority_breakdown),
        }

        return Response(stats)


# Sovereign API Enforcers (Phase 31/32)


class JudgmentDetailView(generics.RetrieveAPIView):
    """
    Retrieve Judgment Details.
    """

    queryset = Judgment.objects.all()
    serializer_class = JudgmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see judgments of their disputes? Or public?
        # For now, authenticated users can view judgments if they are involved or if it's public.
        # Strict permission: involved only + admin.
        user = self.request.user
        if user.role in ["admin", "staff"]:
            return Judgment.objects.all()
        return Judgment.objects.filter(dispute__user=user)


class AppealCreateView(generics.CreateAPIView):
    """
    Create an appeal for a judgment.
    """

    serializer_class = AppealSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        judgment_id = self.kwargs.get("pk")
        judgment = get_object_or_404(Judgment, pk=judgment_id)

        # Verify ownership
        if judgment.dispute.user != self.request.user:
            raise ValidationError("You cannot appeal a judgment that is not yours.")

        if judgment.status != "provisional":
            raise ValidationError("Only provisional judgments can be appealed.")

        serializer.save(judgment=judgment, appellant=self.request.user)


def initiate_dispute(request):
    """
    Sovereign Gateway to the Tribunal.
    Coordinates behavioral checks and hands over to the TribunalEngine.
    """
    user = request.user

    if not user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    # 1. Database Check: Emotional Lock (Behavioral Memory)
    if user.emotional_lock_until and user.emotional_lock_until > timezone.now():
        return JsonResponse(
            TribunalEngine._cooling_off_response(dispute_id="PENDING"), status=202
        )

    try:
        data = json.loads(request.body)
        emotional_state = data.get("emotional_state", "calm")
    except (json.JSONDecodeError, AttributeError):
        emotional_state = "calm"
        data = {}

    # 2. Database Persist: Trigger Lock if Halted (Protective Logic)
    if emotional_state == "angry":
        user.emotional_lock_until = timezone.now() + timezone.timedelta(minutes=15)
        user.save()
        return JsonResponse(
            TribunalEngine._cooling_off_response(dispute_id="NEW"), status=202
        )

    # 3. Handover to Tribunal Engine (Cortex)
    response_data = TribunalEngine.process_initiation(
        user=user,
        merit_score=user.merit_score,
        emotional_state=emotional_state,
        request_data=data,
    )

    # 4. Map Sovereign Status to HTTP
    status_code = 200
    if response_data["status"] == "sovereign_halt":
        status_code = 202
    elif response_data["status"] == "sovereign_conditional":
        status_code = 202

    return JsonResponse(response_data, status=status_code)


from .services import AdjudicationService


@api_view(["POST"])
@permission_classes([IsAdminUser])
def issue_verdict(request, dispute_id):
    """
    Exposes verdict issuance to admins/judges.
    POST /api/v1/judicial/disputes/<id>/verdict/
    """
    try:
        dispute = Dispute.objects.get(id=dispute_id)
    except Dispute.DoesNotExist:
        return Response(
            {"error": "Dispute not found"}, status=status.HTTP_404_NOT_FOUND
        )

    ALLOWED_VERDICT_STATES = {"admissible", "under_review", "judgment_provisional"}
    if dispute.status not in ALLOWED_VERDICT_STATES:
        return Response(
            {"error": f"Cannot issue verdict on dispute in state: {dispute.status}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    verdict_type = request.data.get("verdict")
    ruling_text = request.data.get("ruling_text")
    awarded_amount = request.data.get("awarded_amount", 0)

    try:
        judgment = AdjudicationService.issue_verdict(
            dispute=dispute,
            judge=request.user,
            verdict_type=verdict_type,
            ruling_text=ruling_text,
            awarded_amount=awarded_amount,
        )
    except ValueError as e:
        return Response(
            {"error": "Invalid input provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    return Response(
        {
            "status": "sovereign_proceeding",
            "dignity_preserved": True,
            "code": "JUDGMENT_ISSUED",
            "judgment_id": judgment.id,
        }
    )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def sovereign_override(request, dispute_id):
    """
    Phase 42: The Sovereign Override Endpoint (Red Button).
    POST /api/v1/judicial/disputes/<id>/override/

    Forcefully resolves a dispute, bypassing standard procedure.
    """
    try:
        dispute = Dispute.objects.get(id=dispute_id)
    except Dispute.DoesNotExist:
        return Response(
            {"error": "Dispute not found"}, status=status.HTTP_404_NOT_FOUND
        )

    verdict_type = request.data.get("verdict")
    ruling_text = request.data.get("ruling_text")
    awarded_amount = request.data.get("awarded_amount", 0)
    justification = request.data.get("justification")

    if not justification:
        return Response(
            {"error": "Justification is required for Sovereign Override."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        judgment = AdjudicationService.force_resolution(
            dispute=dispute,
            judge=request.user,
            verdict_type=verdict_type,
            ruling_text=ruling_text,
            awarded_amount=awarded_amount,
            justification=justification,
        )
    except ValueError as e:
        return Response(
            {"error": "Invalid input provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    return Response(
        {
            "status": "sovereign_complete",
            "dignity_preserved": True,
            "code": "SOVEREIGN_OVERRIDE_EXECUTED",
            "judgment_id": judgment.id,
            "message": "Dispute has been forcefully resolved.",
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dispute_status(request, dispute_id):
    """
    Sovereign status check.
    GET /api/v1/judicial/disputes/<id>/status/
    """
    # Guard: visual_assets module may not be installed in all environments
    try:
        from sovereignty.visual_assets import VisualAssetsBuilder

        _has_visual_assets = True
    except ImportError:
        _has_visual_assets = False

    try:
        dispute = Dispute.objects.get(id=dispute_id)
        booking = dispute.booking
        is_owner = booking and getattr(booking.product, "owner", None) == request.user
        if dispute.user != request.user and not is_owner:
            return Response(
                {"error": "Unauthorized to appeal this judgment"},
                status=status.HTTP_403_FORBIDDEN,
            )
    except Dispute.DoesNotExist:
        return Response(
            {"error": "Dispute not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # Determine visual assets based on current state
    current_phase = dispute.status

    # Check for active mediation
    if (
        hasattr(dispute, "mediation_session")
        and dispute.mediation_session.status == "active"
    ):
        current_phase = "mediation_active"

    if _has_visual_assets:
        assets = VisualAssetsBuilder.for_proceeding(str(dispute.id))
        if current_phase == "mediation_active":
            assets["mode"] = "MARKET"
        elif dispute.status == "judgment_provisional":
            assets["mode"] = "VERDICT"
    else:
        assets = {"phase": current_phase, "mode": "DEFAULT"}

    response_data = {
        "status": "sovereign_proceeding",
        "dignity_preserved": True,
        "dispute_id": dispute.id,
        "current_phase": current_phase,
        "visual_assets": assets,
    }

    # Include verdict details if judgment is issued
    if dispute.status in ["judgment_provisional", "judgment_final"]:
        latest_judgment = dispute.judgments.order_by("-created_at").first()
        if latest_judgment:
            response_data["verdict"] = {
                "type": latest_judgment.verdict,
                "body_ar": latest_judgment.ruling_text,
                "awarded_amount": float(latest_judgment.awarded_amount),
                "judgment_hash": str(latest_judgment.id),
            }

    return Response(response_data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def appeal_verdict(request, dispute_id):
    """
    Challenge a Provisional Judgment.
    POST /api/v1/judicial/disputes/<id>/appeal/
    """
    try:
        dispute = Dispute.objects.get(id=dispute_id)
        booking = dispute.booking
        is_owner = booking and getattr(booking.product, "owner", None) == request.user
        if dispute.user != request.user and not is_owner:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
    except Dispute.DoesNotExist:
        return Response(
            {"error": "Dispute not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if dispute.status != "judgment_provisional":
        return Response(
            {"error": "Only provisional judgments can be appealed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    latest_judgment = dispute.judgments.order_by("-created_at").first()
    if not latest_judgment:
        return Response(
            {"error": "No judgment found to appeal."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if hasattr(latest_judgment, "appeal"):
        return Response(
            {"error": "An appeal has already been filed for this judgment."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reason = request.data.get("reason", "No reason provided.")

    appeal = Appeal.objects.create(
        judgment=latest_judgment, appellant=request.user, reason=reason
    )

    # Transition dispute back to under_review (Appeal Deliberation)
    dispute.status = "under_review"
    dispute.save()

    return Response(
        {
            "status": "sovereign_proceeding",
            "dignity_preserved": True,
            "code": "APPEAL_FILED",
            "appeal_id": appeal.id,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def close_dispute(request, dispute_id):
    """
    Accept the verdict and close the dispute.
    POST /api/v1/judicial/disputes/<int:dispute_id>/close/
    """
    try:
        dispute = Dispute.objects.get(id=dispute_id)
        if dispute.user != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
    except Dispute.DoesNotExist:
        return Response(
            {"error": "Dispute not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if dispute.status != "judgment_provisional":
        return Response(
            {"error": "Only disputes with provisional judgments can be closed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    latest_judgment = dispute.judgments.order_by("-created_at").first()
    if latest_judgment:
        AdjudicationService.finalize_judgment(latest_judgment, request.user)

    dispute.status = "closed"
    dispute.save()

    return Response(
        {
            "status": "sovereign_proceeding",
            "dignity_preserved": True,
            "code": "DISPUTE_ARCHIVED",
        }
    )


class TribunalCaseDetailView(generics.RetrieveAPIView):
    """
    Internal View for Judges.
    Provides full context including behavioral history and evidence logs.
    """

    queryset = Dispute.objects.all()
    serializer_class = TribunalDisputeSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"
    lookup_url_kwarg = "dispute_id"


class PublicLedgerListView(generics.ListAPIView):
    """
    Phase 38: The Public Ledger.
    Publicly accessible list of de-identified judgments.
    """

    queryset = AnonymizedJudgment.objects.all()
    serializer_class = AnonymizedJudgmentSerializer
    permission_classes = []  # Publicly accessible
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["category", "verdict"]
    search_fields = ["dispute_type", "ruling_summary"]
    ordering_fields = ["judgment_date", "consistency_score"]
    ordering = ["-judgment_date"]


class MediationView(generics.RetrieveAPIView, generics.CreateAPIView):
    """
    Phase 40: Sovereign Mediation Endpoint.
    GET: Retrieve current mediation session for a dispute.
    POST: Start mediation or Respond to an offer.
    """

    serializer_class = MediationSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Get the mediation session for the dispute
        dispute_id = self.kwargs.get("dispute_id")
        return get_object_or_404(MediationSession, dispute__id=dispute_id)

    def retrieve(self, request, *args, **kwargs):
        """
        Custom retrieve to filter offers based on visibility rules (Phase 44).
        """
        instance = self.get_object()

        # Default serialization
        serializer = self.get_serializer(instance)
        data = serializer.data

        # Apply visibility filter to offers
        # If user is NOT staff, filter out 'pending_review' and 'rejected' offers
        if not (request.user.is_staff or request.user.is_superuser):
            visible_offers = [
                offer
                for offer in data["offers"]
                if offer.get("status") == "visible" or offer.get("source") != "system"
                # Note: Schema update in Task 1 added 'status' field.
                # If field missing (old offers), assume visible.
            ]

            # Re-filter properly using model if needed, but filtering dict is faster here
            data["offers"] = visible_offers

        return Response(data)

    def post(self, request, *args, **kwargs):
        dispute_id = self.kwargs.get("dispute_id")
        dispute = get_object_or_404(Dispute, id=dispute_id)

        # Action: "start" or "accept"
        action = request.data.get("action")

        if action == "start":
            from .services import MediationService

            session = MediationService.start_mediation(dispute)
            return Response(MediationSessionSerializer(session).data)

        elif action == "accept_offer":
            offer_id = request.data.get("offer_id")
            offer = get_object_or_404(
                SettlementOffer, id=offer_id, session__dispute=dispute
            )

            from .services import MediationService

            MediationService.accept_offer(offer)
            return Response({"status": "offer_accepted", "message": "Dispute settled."})

        elif action == "reject_offer":
            offer_id = request.data.get("offer_id")
            offer = get_object_or_404(
                SettlementOffer, id=offer_id, session__dispute=dispute
            )

            from .services import MediationService

            result = MediationService.reject_offer(offer)
            return Response(result)

        # Sovereign-compliant error response
        return Response(
            {
                "status": "sovereign_guidance_required",
                "dignity_preserved": True,
                "message_ar": "الإجراء المطلوب يحتاج مراجعة",
                "message_en": "This action requires review",
                "guidance": "Only accept_offer and reject_offer actions are supported. Please verify your request.",
                "supported_actions": ["accept_offer", "reject_offer"],
            },
            status=400,
        )


# ------------------------------------------------------------------------------
# Phase 44: Human-in-the-loop (Admin Pending Queue)
# ------------------------------------------------------------------------------


class AdminPendingOffersView(generics.ListAPIView):
    """
    List all AI proposals waiting for human approval.
    GET /api/v1/admin/pending-proposals/
    """

    serializer_class = SettlementOfferSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return (
            SettlementOffer.objects.filter(status="pending_review", source="system")
            .select_related("session", "session__dispute")
            .order_by("created_at")
        )


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_decide_offer(request, offer_id):
    """
    The Human Stamp: Approve or Reject an AI proposal.
    POST /api/v1/admin/offers/<id>/decide/
    body: { "action": "approve" | "reject", "rejection_reason": "..." }
    """
    offer = get_object_or_404(SettlementOffer, id=offer_id)
    dispute = offer.session.dispute
    action = request.data.get("action")

    if action == "approve":
        offer.status = "visible"
        offer.approved_by = request.user
        offer.approved_at = timezone.now()
        offer.save()

        # Log the Human Stamp
        EvidenceLog.objects.create(
            dispute=dispute,
            action="AI_PROPOSAL_APPROVED",
            actor=request.user,
            metadata={
                "offer_id": offer.id,
                "amount": float(offer.amount),
                "confidence": f"{offer.confidence_min}-{offer.confidence_max}",
            },
        )
        return Response(
            {"status": "approved", "message": "Proposal is now visible to parties."}
        )

    elif action == "reject":
        reason = request.data.get("rejection_reason", "Administrative Rejection")
        offer.status = "rejected"
        offer.save()

        # Log the Rejection
        EvidenceLog.objects.create(
            dispute=dispute,
            action="AI_PROPOSAL_REJECTED",
            actor=request.user,
            metadata={"offer_id": offer.id, "reason": reason},
        )
        return Response({"status": "rejected", "message": "Proposal rejected."})

    # Sovereign-compliant error response
    return Response(
        {
            "status": "sovereign_guidance_required",
            "dignity_preserved": True,
            "message_ar": "الإجراء الإداري يتطلب صلاحيات",
            "message_en": "This administrative action requires proper authorization",
            "guidance": "Only approve and reject actions are available for administrators.",
            "supported_actions": ["approve", "reject"],
        },
        status=400,
    )


class PublicMetricsView(generics.ListAPIView):
    """
    Phase 38: Transparency Dashboard.
    Aggregate metrics with mandatory context cards.
    """

    queryset = PublicMetrics.objects.select_related("context_card").all()
    serializer_class = PublicMetricsSerializer
    permission_classes = []  # Publicly accessible
    filterset_fields = ["metric_type", "category"]


# ⚖️ HIGH COURT: Integrity Monitoring (Phase 6)
from .services.vault_audit import VaultAuditor


class VaultIntegrityView(SovereignResponseMixin, generics.GenericAPIView):
    """
    High Court Oversight: Verify the Evidence Vault integrity.
    Phase 6: The High-Security Executive Suite.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        # Run the full chain audit
        audit_result = VaultAuditor.audit_full_chain()

        return Response(
            {
                "status": "sovereign_governance",
                "dignity_preserved": True,
                "code": "VAULT_INTEGRITY_REPORT",
                "audit": audit_result,
            }
        )


from .services.ledger_export import LedgerExportService
from django.http import HttpResponse


class ExportIntegrityCertificateView(SovereignResponseMixin, generics.GenericAPIView):
    """
    High Court: Export the Sovereign Integrity Certificate (Phase 7).
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        cert_data = LedgerExportService.generate_integrity_certificate(
            actor=request.user
        )

        # In a real environment, we might use WeasyPrint or similar to convert to PDF.
        # For now, we return the premium HTML certificate which can be printed to PDF by the browser.
        return HttpResponse(cert_data["html"], content_type="text/html")
