# conversation/urls.py
from django.urls import path
from .views import (
    ChatSessionListView,
    ChatSessionDetailView,
    ChatMessageView,
)

urlpatterns = [
    # Session management
    path("sessions", ChatSessionListView.as_view(), name="chat-session-list"),
    path("sessions/<str:session_id>", ChatSessionDetailView.as_view(), name="chat-session-detail"),
    
    # Message operations
    path("sessions/<str:session_id>/messages", ChatMessageView.as_view(), name="chat-message"),
]
