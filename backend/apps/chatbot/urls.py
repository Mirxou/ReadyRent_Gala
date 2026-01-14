from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatSessionViewSet, ChatbotConfigurationViewSet, quick_chat

router = DefaultRouter()
router.register(r'sessions', ChatSessionViewSet, basename='chat-session')
router.register(r'config', ChatbotConfigurationViewSet, basename='chatbot-config')

urlpatterns = [
    path('quick-chat/', quick_chat, name='quick-chat'),
    path('', include(router.urls)),
]

