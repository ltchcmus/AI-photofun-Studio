"""
URL Configuration for AI Tasks API
"""
from django.urls import path
from . import views

app_name = 'ai_tasks'

urlpatterns = [
    path('submit/', views.TaskSubmitView.as_view(), name='task-submit'),
    path('<str:task_id>/status/', views.TaskStatusView.as_view(), name='task-status'),
    path('<str:task_id>/result/', views.TaskResultView.as_view(), name='task-result'),
    path('<str:task_id>/cancel/', views.TaskCancelView.as_view(), name='task-cancel'),
]
