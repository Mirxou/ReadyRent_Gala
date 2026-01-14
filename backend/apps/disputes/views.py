"""
Views for Disputes app
"""
from rest_framework import generics, status, filters
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Dispute, DisputeMessage, SupportTicket, TicketMessage
from .serializers import (
    DisputeSerializer, DisputeMessageSerializer,
    SupportTicketSerializer, TicketMessageSerializer
)


# Dispute Views
class DisputeCreateView(generics.CreateAPIView):
    """Create dispute"""
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DisputeListView(generics.ListAPIView):
    """List user's disputes"""
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Dispute.objects.select_related('user', 'booking', 'assigned_to', 'resolved_by').prefetch_related('messages')
        # Users can only see their own disputes unless admin
        if self.request.user.role not in ['admin', 'staff']:
            queryset = queryset.filter(user=self.request.user)
        return queryset


class DisputeDetailView(generics.RetrieveUpdateAPIView):
    """Get or update dispute"""
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Dispute.objects.select_related('user', 'booking', 'assigned_to', 'resolved_by').prefetch_related('messages')
        # Users can only see their own disputes unless admin
        if self.request.user.role not in ['admin', 'staff']:
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    def perform_update(self, serializer):
        instance = self.get_object()
        # Only admin/staff can update status and assign
        if self.request.user.role not in ['admin', 'staff']:
            # Users can only update their own disputes and only description
            if instance.user != self.request.user:
                raise ValidationError('Permission denied')
            allowed_fields = ['description']
            for field in serializer.validated_data:
                if field not in allowed_fields:
                    raise ValidationError(f'Cannot update {field}')
        
        # Update resolved_at if status changed to resolved
        if 'status' in serializer.validated_data:
            if serializer.validated_data['status'] == 'resolved' and instance.status != 'resolved':
                serializer.validated_data['resolved_at'] = timezone.now()
                serializer.validated_data['resolved_by'] = self.request.user
        
        serializer.save()


class DisputeMessageCreateView(generics.CreateAPIView):
    """Add message to dispute"""
    serializer_class = DisputeMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        dispute_id = self.request.data.get('dispute')
        try:
            dispute = Dispute.objects.get(pk=dispute_id)
            # Check permissions
            if dispute.user != self.request.user and self.request.user.role not in ['admin', 'staff']:
                raise ValidationError('Permission denied')
            serializer.save(dispute=dispute, user=self.request.user)
        except Dispute.DoesNotExist:
            raise ValidationError('Dispute not found')


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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['subject', 'description']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = SupportTicket.objects.select_related('user', 'assigned_to').prefetch_related('messages')
        # Users can only see their own tickets unless admin
        if self.request.user.role not in ['admin', 'staff']:
            queryset = queryset.filter(user=self.request.user)
        return queryset


class SupportTicketDetailView(generics.RetrieveUpdateAPIView):
    """Get or update support ticket"""
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = SupportTicket.objects.select_related('user', 'assigned_to').prefetch_related('messages')
        # Users can only see their own tickets unless admin
        if self.request.user.role not in ['admin', 'staff']:
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    def perform_update(self, serializer):
        instance = self.get_object()
        # Only admin/staff can update status and assign
        if self.request.user.role not in ['admin', 'staff']:
            # Users can only update their own tickets and only description
            if instance.user != self.request.user:
                raise ValidationError('Permission denied')
            allowed_fields = ['description']
            for field in serializer.validated_data:
                if field not in allowed_fields:
                    raise ValidationError(f'Cannot update {field}')
        
        # Update resolved_at if status changed to resolved
        if 'status' in serializer.validated_data:
            if serializer.validated_data['status'] == 'resolved' and instance.status != 'resolved':
                serializer.validated_data['resolved_at'] = timezone.now()
        
        serializer.save()


class TicketMessageCreateView(generics.CreateAPIView):
    """Add message to ticket"""
    serializer_class = TicketMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        ticket_id = self.request.data.get('ticket')
        try:
            ticket = SupportTicket.objects.get(pk=ticket_id)
            # Check permissions
            if ticket.user != self.request.user and self.request.user.role not in ['admin', 'staff']:
                raise ValidationError('Permission denied')
            serializer.save(ticket=ticket, user=self.request.user)
        except SupportTicket.DoesNotExist:
            raise ValidationError('Ticket not found')


# Admin Views
class AdminDisputeStatsView(generics.GenericAPIView):
    """Get dispute statistics (admin only)"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        total_disputes = Dispute.objects.count()
        open_disputes = Dispute.objects.filter(status='open').count()
        under_review = Dispute.objects.filter(status='under_review').count()
        resolved = Dispute.objects.filter(status='resolved').count()
        
        priority_breakdown = Dispute.objects.values('priority').annotate(count=Count('id'))
        
        stats = {
            'total': total_disputes,
            'open': open_disputes,
            'under_review': under_review,
            'resolved': resolved,
            'priority_breakdown': list(priority_breakdown),
        }
        
        return Response(stats)


class AdminTicketStatsView(generics.GenericAPIView):
    """Get ticket statistics (admin only)"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        total_tickets = SupportTicket.objects.count()
        open_tickets = SupportTicket.objects.filter(status='open').count()
        in_progress = SupportTicket.objects.filter(status='in_progress').count()
        resolved = SupportTicket.objects.filter(status='resolved').count()
        
        priority_breakdown = SupportTicket.objects.values('priority').annotate(count=Count('id'))
        
        stats = {
            'total': total_tickets,
            'open': open_tickets,
            'in_progress': in_progress,
            'resolved': resolved,
            'priority_breakdown': list(priority_breakdown),
        }
        
        return Response(stats)

