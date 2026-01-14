from django.contrib import admin
from .models import Dispute, DisputeMessage, SupportTicket, TicketMessage


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'status', 'priority', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']
    date_hierarchy = 'created_at'


@admin.register(DisputeMessage)
class DisputeMessageAdmin(admin.ModelAdmin):
    list_display = ['dispute', 'user', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['message', 'dispute__title', 'user__email']
    readonly_fields = ['created_at']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['subject', 'user', 'status', 'priority', 'category', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'category', 'created_at']
    search_fields = ['subject', 'description', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']
    date_hierarchy = 'created_at'


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'user', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['message', 'ticket__subject', 'user__email']
    readonly_fields = ['created_at']


