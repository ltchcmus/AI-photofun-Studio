"""
URL routing for Remove Background feature
"""
from django.urls import path
from .views import RemoveBackgroundView

urlpatterns = [
    path('', RemoveBackgroundView.as_view(), name='remove-background'),
]
