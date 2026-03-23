import json
import asyncio
import base64
from channels.generic.websocket import AsyncWebsocketConsumer

class AIJudgeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'ai_judge_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        # Handle binary audio data
        if bytes_data:
            # In a real implementation, this would stream to OpenAI Realtime API
            # For this prototype, we'll log the size and pretend to analyze
            await self.process_audio_chunk(bytes_data)
        
        # Handle control messages (JSON)
        if text_data:
            data = json.loads(text_data)
            msg_type = data.get('type')
            
            if msg_type == 'session_update':
                # Update context (e.g. agreed price: 5000 DA)
                self.context = data.get('payload')

    async def process_audio_chunk(self, chunk):
        # SIMULATION: 
        # In production, this pushes 'chunk' to the OpenAI WebSocket.
        # Here, we randomly trigger an event to demonstrate the UI.
        import random
        
        # 1% chance to simulate a "Price Dispute" per chunk to test UI
        if random.random() < 0.01:
            await self.send_alert(
                "dispute_detected", 
                "⚠️ اختلاف في السعر: الطرف الآخر يقترح 4000 دج بدل 5000 دج المتفق عليها."
            )

    async def send_alert(self, type, message):
        await self.send(text_data=json.dumps({
            'type': type,
            'message': message
        }))
