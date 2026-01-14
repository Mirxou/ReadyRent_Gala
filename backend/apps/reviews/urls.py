"""
URLs for Review app
"""
from django.urls import path
from .views import ReviewCreateView, ReviewListView, ReviewModerationView

app_name = 'reviews'

urlpatterns = [
    path('', ReviewListView.as_view(), name='review-list'),
    path('create/', ReviewCreateView.as_view(), name='review-create'),
    path('<int:pk>/moderate/', ReviewModerationView.as_view(), name='review-moderate'),
]

