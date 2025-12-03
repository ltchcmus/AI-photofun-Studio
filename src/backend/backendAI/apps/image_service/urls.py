from django.urls import path
from .views import ImageGenerateView

urlpatterns = [
    path("generate", ImageGenerateView.as_view(), name="image-generate"),
]
