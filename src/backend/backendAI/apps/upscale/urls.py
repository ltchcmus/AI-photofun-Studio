"""
URL routing for Upscale feature
"""
from django.urls import path
from .views import UpscaleView, UpscaleStatusView

urlpatterns = [
    path('', UpscaleView.as_view(), name='upscale'),
    path('status/<str:task_id>/', UpscaleStatusView.as_view(), name='upscale-status'),
]
