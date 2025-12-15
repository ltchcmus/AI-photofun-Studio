"""
URL routing for Reimagine feature
"""
from django.urls import path
from .views import ReimagineView, ReimagineStatusView

urlpatterns = [
    path('', ReimagineView.as_view(), name='reimagine'),
    path('status/<str:task_id>/', ReimagineStatusView.as_view(), name='reimagine-status'),
]
