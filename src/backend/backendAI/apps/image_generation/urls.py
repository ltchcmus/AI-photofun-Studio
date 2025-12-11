"""
URL routing for Image Generation feature
"""
from django.urls import path
from .views import ImageGenerationView

urlpatterns = [
    # Direct feature access (không qua conversation)
    path('', ImageGenerationView.as_view(), name='image-generation'),
]
