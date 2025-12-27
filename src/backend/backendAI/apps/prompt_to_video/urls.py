from django.urls import path

from .views import PromptToVideoStatusView, PromptToVideoView

urlpatterns = [
    path("", PromptToVideoView.as_view(), name="prompt-to-video"),
    path("status/<str:task_id>/", PromptToVideoStatusView.as_view(), name="prompt-to-video-status"),
]
