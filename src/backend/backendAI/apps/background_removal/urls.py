from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BackgroundRemovalViewSet

router = DefaultRouter()
router.register(r'', BackgroundRemovalViewSet, basename='background-removal')

urlpatterns = [
    path('', include(router.urls)),
]
