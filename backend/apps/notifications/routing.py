"""
WebSocket routing for notifications and real-time updates
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/notifications/(?P<user_id>\d+)/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/bookings/(?P<user_id>\d+)/$', consumers.BookingStatusConsumer.as_asgi()),
    re_path(r'ws/inventory/(?P<user_id>\d+)/$', consumers.InventoryUpdateConsumer.as_asgi()),
]

