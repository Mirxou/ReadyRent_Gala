"""
WebSocket consumers for real-time notifications and updates
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'ping':
            # Respond to ping with pong
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))
    
    async def notification_message(self, event):
        """Send notification to WebSocket"""
        notification = event['notification']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': notification
        }))


class BookingStatusConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time booking status updates"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'bookings_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))
    
    async def booking_update(self, event):
        """Send booking status update to WebSocket"""
        booking = event['booking']
        
        await self.send(text_data=json.dumps({
            'type': 'booking_update',
            'booking': booking
        }))


class InventoryUpdateConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time inventory updates (admin only)"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'inventory_updates'
        
        # Verify user is admin/staff
        try:
            user = await database_sync_to_async(User.objects.get)(id=self.user_id)
            if not user or user.role not in ['admin', 'staff']:
                await self.close(code=403)
                return
        except User.DoesNotExist:
            await self.close(code=404)
            return
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error verifying user for inventory updates: {e}")
            await self.close(code=500)
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))
    
    async def inventory_update(self, event):
        """Send inventory update to WebSocket"""
        update = event['update']
        
        await self.send(text_data=json.dumps({
            'type': 'inventory_update',
            'update': update
        }))

