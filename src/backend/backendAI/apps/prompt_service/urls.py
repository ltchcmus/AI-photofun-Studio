from django.urls import path
from .views import PromptRefineView

urlpatterns = [
    path("refine", PromptRefineView.as_view(), name="prompt-refine"),
]
