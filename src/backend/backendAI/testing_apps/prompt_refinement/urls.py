"""
URL Configuration for Prompt Refinement Service
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromptRefinementViewSet, PromptTemplateViewSet

app_name = 'prompt_refinement'

router = DefaultRouter()
router.register(r'', PromptRefinementViewSet, basename='prompt-refinement')
router.register(r'templates', PromptTemplateViewSet, basename='prompt-templates')

urlpatterns = [
    path('', include(router.urls)),
]
