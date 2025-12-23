from django.urls import path
from .views import PromptRefineView, TestParameterExtractionView

urlpatterns = [
    path("refine", PromptRefineView.as_view(), name="prompt-refine"),
    path("test-extract", TestParameterExtractionView.as_view(), name="test-parameter-extraction"),
]
