"""
URL routing for Image Generation feature
"""
from django.urls import path
from .views import ImageGenerationView, ImageGenerationStatusView

urlpatterns = [
    # Direct feature access (không qua conversation)
    path('', ImageGenerationView.as_view(), name='image-generation'),
    # Poll task status
    path('status/<str:task_id>/', ImageGenerationStatusView.as_view(), name='image-generation-status'),
]
