from django.urls import path

from .views import ImageToVideoStatusView, ImageToVideoView

urlpatterns = [
    path("", ImageToVideoView.as_view(), name="image-to-video"),
    path("status/<str:task_id>/", ImageToVideoStatusView.as_view(), name="image-to-video-status"),
]
