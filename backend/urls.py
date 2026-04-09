
from django.contrib import admin
from django.urls import path
from apps.disputes.views import initiate_dispute

urlpatterns = [
    path('admin/', admin.site.urls),
    # Sovereign API Endpoints
    path('api/v1/judicial/disputes/initiate', initiate_dispute),
]
