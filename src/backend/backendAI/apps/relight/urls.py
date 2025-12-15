"""
URL routing for Relight feature
"""
from django.urls import path
from .views import RelightView, RelightStatusView

urlpatterns = [
    path('', RelightView.as_view(), name='relight'),
    path('status/<str:task_id>/', RelightStatusView.as_view(), name='relight-status'),
]
