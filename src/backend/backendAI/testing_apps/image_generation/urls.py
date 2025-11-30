"""
URL Configuration for Image Generation Service
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ImageGenerationViewSet

app_name = 'image_generation'

router = DefaultRouter()
router.register(r'', ImageGenerationViewSet, basename='image-generation')

urlpatterns = [
    path('', include(router.urls)),
]
