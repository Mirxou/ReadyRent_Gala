from django.urls import path
from .views import VouchCreateView, SocialFeedView, MarketPulseView

urlpatterns = [
    path('vouch/<int:user_id>/', VouchCreateView.as_view(), name='vouch-user'),
    path('feed/', SocialFeedView.as_view(), name='social-feed'),
    path('pulse/', MarketPulseView.as_view(), name='market-pulse'),
]
