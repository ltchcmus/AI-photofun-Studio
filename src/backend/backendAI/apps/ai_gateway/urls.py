"""
URL Configuration for AI Gateway app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatGatewayViewSet

app_name = 'ai_gateway'

router = DefaultRouter()
router.register(r'', ChatGatewayViewSet, basename='chat-gateway')

urlpatterns = [
    path('', include(router.urls)),
]
