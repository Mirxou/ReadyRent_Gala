import pytest
import json
from unittest.mock import patch
from channels.testing import WebsocketCommunicator
from django.urls import re_path
from channels.routing import URLRouter
from apps.communication.consumers_ai import AIJudgeConsumer
from django.test import SimpleTestCase

@pytest.mark.asyncio
async def test_ai_judge_connection_and_alert():
    # 1. Wrap in URLRouter to populate scope['url_route']['kwargs']
    application = URLRouter([
        re_path(r'ws/ai-judge/(?P<room_name>\w+)/$', AIJudgeConsumer.as_asgi()),
    ])

    # 2. Connect
    communicator = WebsocketCommunicator(application, "/ws/ai-judge/test_room/")
    connected, subprotocol = await communicator.connect()
    assert connected

    # 3. Patch random to ensure the alert triggers (1% chance -> 100% chance)
    with patch('random.random', return_value=0.005):
        # 3. Send fake audio bytes
        await communicator.send_to(bytes_data=b'\x00\x01\x02')
        
        # 5. Receive response
        response = await communicator.receive_json_from()
        
        # 6. Verify Response Structure
        assert response['type'] == 'dispute_detected'
        assert '⚠️' in response['message']

    # 7. Disconnect
    await communicator.disconnect()
