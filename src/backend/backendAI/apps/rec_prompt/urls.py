from django.urls import path

from .views import RecPromptSuggestView, RecPromptChooseView

urlpatterns = [
    path("suggest", RecPromptSuggestView.as_view(), name="rec-prompt-suggest"),
    path("choose", RecPromptChooseView.as_view(), name="rec-prompt-choose"),
]
