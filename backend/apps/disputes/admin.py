"""
Django Admin customizations for Disputes app
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    Dispute, DisputeMessage, SupportTicket, TicketMessage, 
    EvidenceLog, Judgment, Appeal, JudicialPanel,
    MediationSession, SettlementOffer
)
from .services.admin_service import SovereignGateService


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user', 'status', 'priority', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(JudicialPanel)
class JudicialPanelAdmin(admin.ModelAdmin):
    list_display = ['name', 'panel_type', 'is_active', 'current_load']
    list_filter = ['panel_type', 'is_active']


@admin.register(SettlementOffer)
class SettlementOfferAdmin(admin.ModelAdmin):
    """
    The Sovereign Gate Interface.
    Admins can approve/reject AI proposals here.
    """
    list_display = [
        'id', 
        'dispute_link', 
        'source', 
        'amount_display', 
        'status_badge', 
        'created_at'
    ]
    list_filter = ['status', 'source', 'created_at']
    search_fields = ['session__dispute__title', 'session__dispute__user__email']
    readonly_fields = ['source', 'amount', 'reasoning', 'created_at', 'approved_by', 'approved_at']
    
    actions = ['approve_offers', 'reject_offers']
    
    def dispute_link(self, obj):
        """Link to the related dispute."""
        dispute = obj.session.dispute
        url = reverse('admin:disputes_dispute_change', args=[dispute.id])
        return format_html('<a href="{}">{}</a>', url, dispute.title)
    dispute_link.short_description = 'Dispute'
    
    def amount_display(self, obj):
        """Display amount with currency."""
        return f"{obj.amount} DZD"
    amount_display.short_description = 'Amount'
    
    def status_badge(self, obj):
        """Visual badge for status."""
        colors = {
            'pending_review': '#ff9800',  # Orange
            'visible': '#4caf50',  # Green
            'rejected': '#f44336',  # Red
        }
        color = colors.get(obj.status, '#999')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def approve_offers(self, request, queryset):
        """Bulk approve selected offers."""
        count = 0
        for offer in queryset:
            if offer.status == SettlementOffer.Status.PENDING_REVIEW:
                try:
                    SovereignGateService.approve_offer(offer.id, request.user)
                    count += 1
                except ValueError:
                    pass
        self.message_user(request, f'{count} offer(s) approved.')
    approve_offers.short_description = '✓ Approve selected offers (Open Gate)'
    
    def reject_offers(self, request, queryset):
        """Bulk reject selected offers."""
        count = 0
        for offer in queryset:
            if offer.status == SettlementOffer.Status.PENDING_REVIEW:
                try:
                    SovereignGateService.reject_offer(offer.id, request.user, 'Bulk rejection by admin')
                    count += 1
                except ValueError:
                    pass
        self.message_user(request, f'{count} offer(s) rejected.')
    reject_offers.short_description = '✗ Reject selected offers (Close Gate)'
    
    def get_queryset(self, request):
        """Highlight pending offers at the top."""
        qs = super().get_queryset(request)
        return qs.order_by('-status', '-created_at')


@admin.register(MediationSession)
class MediationSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'dispute', 'status', 'current_round', 'expires_at']
    list_filter = ['status']
    readonly_fields = ['dispute', 'started_at', 'expires_at']


@admin.register(EvidenceLog)
class EvidenceLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'action', 'actor', 'timestamp', 'hash']
    list_filter = ['action', 'timestamp']
    search_fields = ['action', 'actor__email']
    readonly_fields = ['action', 'actor', 'timestamp', 'hash', 'previous_hash', 'metadata', 'context_snapshot']


@admin.register(Judgment)
class JudgmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'dispute', 'verdict', 'status', 'awarded_amount', 'finalized_at']
    list_filter = ['verdict', 'status']
    readonly_fields = ['created_at', 'finalized_at']
