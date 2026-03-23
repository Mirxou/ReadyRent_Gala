from django.urls import path
from .views import VouchCreateView

urlpatterns = [
    path('vouch/<int:user_id>/', VouchCreateView.as_view(), name='vouch-user'),
]
