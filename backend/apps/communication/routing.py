from django.urls import re_path
from . import consumers, consumers_ai

websocket_urlpatterns = [
    re_path(r'ws/call/(?P<room_name>\w+)/$', consumers.SignalingConsumer.as_asgi()),
    re_path(r'ws/ai-judge/(?P<room_name>\w+)/$', consumers_ai.AIJudgeConsumer.as_asgi()),
]
