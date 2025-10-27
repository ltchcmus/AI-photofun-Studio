from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FaceSwapViewSet

router = DefaultRouter()
router.register(r'', FaceSwapViewSet, basename='face-swap')

urlpatterns = [
    path('', include(router.urls)),
]
