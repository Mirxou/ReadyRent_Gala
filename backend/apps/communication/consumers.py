import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SignalingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'call_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        payload = data.get('payload')
        target = data.get('target')

        # Send message to room group
        # in a real app, you might want to send only to the specific 'target' user
        # but for this P2P setup, broadcasting to the room (max 2 users) is fine for the handshake
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'signaling_message',
                'message_type': message_type,
                'payload': payload,
                'sender_channel_name': self.channel_name
            }
        )

    # Receive message from room group
    async def signaling_message(self, event):
        message_type = event['message_type']
        payload = event['payload']
        sender_channel_name = event['sender_channel_name']

        # Do not send the message back to the sender
        if self.channel_name != sender_channel_name:
            await self.send(text_data=json.dumps({
                'type': message_type,
                'payload': payload
            }))
