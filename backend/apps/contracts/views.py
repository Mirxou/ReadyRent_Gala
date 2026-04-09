from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import SmartAgreement, Contract
from .serializers import (
    AudioUploadSerializer,
    SmartAgreementSerializer,
    ContractSerializer,
)
from .services.ai_contract import AIContractService
from apps.bookings.models import Booking
import logging

logger = logging.getLogger(__name__)


class ContractGenerationView(views.APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        serializer = AudioUploadSerializer(data=request.data)
        if serializer.is_valid():
            booking_id = serializer.validated_data["booking_id"]
            audio_file = serializer.validated_data["audio"]

            # Verify Booking ownership
            booking = get_object_or_404(Booking, id=booking_id)
            if request.user != booking.user and request.user != booking.product.owner:
                return Response(
                    {"detail": "Not authorized for this booking."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            try:
                # 1. Create Initial Record
                agreement = SmartAgreement.objects.create(
                    buyer=booking.user,
                    seller=booking.product.owner
                    or booking.user,  # Fallback if no owner (P2P vs Managed)
                    audio_file=audio_file,
                    status="PENDING_REVIEW",
                )

                # 2. Process with AI (Whisper + GPT-4)
                # In production, this should be a Celery task.
                # For MVP Phase 4, we run it synchronously (Video Demo Mode).
                transcript, terms = AIContractService.process_agreement(
                    agreement.audio_file
                )

                # 3. Update Record
                agreement.transcript = transcript
                agreement.extracted_terms = terms
                agreement.save()

                return Response(
                    SmartAgreementSerializer(agreement).data,
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                logger.error(f"Agreement creation failed: {str(e)}", exc_info=True)
                return Response(
                    {"detail": "Internal server error"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SignAgreementView(views.APIView):
    """
    Endpoint for Buyer or Seller to digitally sign the agreement.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        agreement = get_object_or_404(SmartAgreement, pk=pk)
        user = request.user

        # 1. Identity Check
        if user != agreement.buyer and user != agreement.seller:
            return Response(
                {"detail": "Not authorized to sign this agreement."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from django.utils import timezone
        import hashlib

        # 2. Signing Logic
        updated = False
        if user == agreement.buyer:
            if not agreement.buyer_signed_at:
                agreement.buyer_signed_at = timezone.now()
                updated = True
        elif user == agreement.seller:
            if not agreement.seller_signed_at:
                agreement.seller_signed_at = timezone.now()
                updated = True

        if updated:
            # 3. Check for Full Execution (Double Auth)
            if agreement.buyer_signed_at and agreement.seller_signed_at:
                agreement.status = "ACCEPTED"

                # generate hash proof
                raw_data = f"{agreement.id}:{agreement.buyer.id}:{agreement.seller.id}:{agreement.transcript}:{agreement.buyer_signed_at}:{agreement.seller_signed_at}"
                agreement.digital_signature_hash = hashlib.sha256(
                    raw_data.encode()
                ).hexdigest()

            agreement.save()
            return Response(SmartAgreementSerializer(agreement).data)

        return Response({"detail": "Already signed."}, status=status.HTTP_200_OK)


from rest_framework.decorators import action
from django.db.models import Q
from rest_framework import mixins


class ContractViewSet(
    mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet
):
    """
    API endpoints for the strictly immutable, dual-signature Digital Contracts.
    """

    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # User sees contracts where they are either renter or owner
        return Contract.objects.filter(
            Q(booking__user=user) | Q(booking__product__owner=user)
        ).select_related("booking", "booking__user", "booking__product__owner")

    @action(detail=True, methods=["post"])
    def sign(self, request, pk=None):
        contract = self.get_object()
        user = request.user
        ip_address = request.META.get("REMOTE_ADDR")

        try:
            contract.sign(user=user, ip_address=ip_address)
            return Response(
                ContractSerializer(contract).data, status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response(
                {"detail": "Invalid input provided"}, status=status.HTTP_400_BAD_REQUEST
            )
