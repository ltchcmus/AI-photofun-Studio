"""
URL routing for Image Expand feature
"""
from django.urls import path
from .views import ImageExpandView, ImageExpandStatusView

urlpatterns = [
    path('', ImageExpandView.as_view(), name='image-expand'),
    path('status/<str:task_id>/', ImageExpandStatusView.as_view(), name='image-expand-status'),
]
