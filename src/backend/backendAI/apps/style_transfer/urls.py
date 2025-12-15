"""
URL routing for Style Transfer feature
"""
from django.urls import path
from .views import StyleTransferView, StyleTransferStatusView

urlpatterns = [
    path('', StyleTransferView.as_view(), name='style-transfer'),
    path('status/<str:task_id>/', StyleTransferStatusView.as_view(), name='style-transfer-status'),
]
