# conversation/urls.py
from django.urls import path
from .views import (
    ConversationListView,
    ConversationDetailView,
    ConversationMessageView,
    MessageDetailView,
)

urlpatterns = [
    # Session management
    path('', ConversationListView.as_view(), name='conversation-list'),
    path('<str:session_id>/', ConversationDetailView.as_view(), name='conversation-detail'),
    
    # Message management
    path('<str:session_id>/message/', ConversationMessageView.as_view(), name='conversation-message-create'),
    path('<str:session_id>/messages/<str:message_id>/', MessageDetailView.as_view(), name='message-detail'),
]
