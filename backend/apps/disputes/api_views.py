"""
DRF ViewSets for Sovereign Judicial System APIs
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Dispute, MediationSession, SettlementOffer
from .serializers import (
    DisputeSerializer, MediationSessionSerializer, SettlementOfferSerializer
)
from .permissions import IsDisputeOwner, IsOfferParty, IsStaffOnly
from .mediation_service import MediationService
from .admin_service import SovereignGateService
from .api_schemas import (
    dispute_create_schema, mediation_session_schema,
    offer_accept_schema, offer_reject_schema,
    admin_pending_schema, admin_approve_schema, admin_reject_schema
)



class DisputeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Dispute CRUD and mediation access.
    """
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated, IsDisputeOwner]
    
    def get_queryset(self):
        # Users can only see their own disputes
        return Dispute.objects.filter(user=self.request.user).order_by('-created_at')
    
    @dispute_create_schema
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        # Auto-assign user
        serializer.save(user=self.request.user)
        
    @mediation_session_schema
    @action(detail=True, methods=['get'])
    def mediation_session(self, request, pk=None):
        """
        Get mediation session for this dispute.
        """
        dispute = self.get_object()
        
        if not hasattr(dispute, 'mediation_session'):
            return Response(
                {"message": "No mediation session exists for this dispute."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        session = dispute.mediation_session
        serializer = MediationSessionSerializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def offers(self, request, pk=None):
        """
        List VISIBLE settlement offers for this dispute.
        (PENDING_REVIEW offers are hidden)
        """
        dispute = self.get_object()
        
        if not hasattr(dispute, 'mediation_session'):
            return Response([], status=status.HTTP_200_OK)
        
        session = dispute.mediation_session
        # Filter: Only VISIBLE offers
        offers = session.offers.filter(status=SettlementOffer.Status.VISIBLE)
        serializer = SettlementOfferSerializer(offers, many=True)
        return Response(serializer.data)


class SettlementOfferViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Settlement Offers (Read + Custom Actions).
    """
    serializer_class = SettlementOfferSerializer
    permission_classes = [IsAuthenticated, IsOfferParty]
    
    def get_queryset(self):
        # Users can only see offers from their own disputes
        # AND only VISIBLE offers
        return SettlementOffer.objects.filter(
            session__dispute__user=self.request.user,
            status=SettlementOffer.Status.VISIBLE
        )
    
    @offer_accept_schema
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        Accept this settlement offer.
        """
        offer = self.get_object()
        
        if offer.is_accepted:
            return Response(
                {"message": "Offer already accepted."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process acceptance
        MediationService.accept_offer(offer)
        
        return Response(
            {"message": "Offer accepted. Dispute resolved."},
            status=status.HTTP_200_OK
        )
    
    @offer_reject_schema
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject this settlement offer.
        """
        offer = self.get_object()
        
        if offer.is_accepted:
            return Response(
                {"message": "Cannot reject an already accepted offer."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process rejection
        result = MediationService.reject_offer(offer)
        
        return Response(result, status=status.HTTP_200_OK)


class AdminOfferViewSet(viewsets.GenericViewSet):
    """
    Admin-only ViewSet for approving/rejecting AI proposals.
    The Sovereign Gate.
    """
    serializer_class = SettlementOfferSerializer
    permission_classes = [IsStaffOnly]
    queryset = SettlementOffer.objects.all()
    
    @admin_pending_schema
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        List all pending offers awaiting approval.
        """
        pending_offers = SettlementOffer.objects.filter(
            status=SettlementOffer.Status.PENDING_REVIEW
        ).order_by('-session__dispute__priority', '-created_at')
        
        serializer = self.get_serializer(pending_offers, many=True)
        return Response(serializer.data)
    
    @admin_approve_schema
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a pending offer (Open the Sovereign Gate).
        """
        offer = get_object_or_404(SettlementOffer, pk=pk)
        
        try:
            SovereignGateService.approve_offer(offer.id, request.user)
            return Response(
                {"message": "Offer approved and made visible to parties."},
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @admin_reject_schema
    @action(detail=True, methods=['post'])
    def reject_offer(self, request, pk=None):
        """
        Reject a pending offer (Close the Sovereign Gate).
        """
        offer = get_object_or_404(SettlementOffer, pk=pk)
        reason = request.data.get('reason', 'No reason provided')
        
        try:
            SovereignGateService.reject_offer(offer.id, request.user, reason)
            return Response(
                {"message": "Offer rejected."},
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
