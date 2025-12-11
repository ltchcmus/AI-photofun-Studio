"""
URL routing for Upscale feature
"""
from django.urls import path
from .views import UpscaleView

urlpatterns = [
    path('', UpscaleView.as_view(), name='upscale'),
]
