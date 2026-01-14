"""
URLs for Disputes app
"""
from django.urls import path
from .views import (
    DisputeCreateView, DisputeListView, DisputeDetailView, DisputeMessageCreateView,
    SupportTicketCreateView, SupportTicketListView, SupportTicketDetailView,
    TicketMessageCreateView, AdminDisputeStatsView, AdminTicketStatsView
)

app_name = 'disputes'

urlpatterns = [
    # Dispute routes
    path('disputes/', DisputeListView.as_view(), name='dispute-list'),
    path('disputes/create/', DisputeCreateView.as_view(), name='dispute-create'),
    path('disputes/<int:pk>/', DisputeDetailView.as_view(), name='dispute-detail'),
    path('disputes/<int:pk>/messages/', DisputeMessageCreateView.as_view(), name='dispute-message-create'),
    
    # Support ticket routes
    path('tickets/', SupportTicketListView.as_view(), name='ticket-list'),
    path('tickets/create/', SupportTicketCreateView.as_view(), name='ticket-create'),
    path('tickets/<int:pk>/', SupportTicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/<int:pk>/messages/', TicketMessageCreateView.as_view(), name='ticket-message-create'),
    
    # Admin routes
    path('admin/disputes/stats/', AdminDisputeStatsView.as_view(), name='admin-dispute-stats'),
    path('admin/tickets/stats/', AdminTicketStatsView.as_view(), name='admin-ticket-stats'),
]


