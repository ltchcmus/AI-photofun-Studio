import logging

from rest_framework.views import APIView
from rest_framework import status

from core import APIResponse
from .serializers import SuggestRequestSerializer, ChooseRequestSerializer
from .services import get_service

logger = logging.getLogger(__name__)


class RecPromptSuggestView(APIView):
    def post(self, request):
        serializer = SuggestRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Validation failed", result=serializer.errors)

        data = serializer.validated_data
        user_id = data["user_id"].strip()
        query = data.get("prompt", "") or ""

        try:
            service = get_service()
            results = service.suggest(user_id=user_id, query=query, topk=5)
            items = [
                {"id": pid, "text": text, "score": score}
                for pid, text, score in results
            ]
            return APIResponse.success(
                result={
                    "user_id": user_id,
                    "query": query,
                    "results": items,
                }
            )
        except Exception as exc:
            logger.exception("rec_prompt suggest failed")
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RecPromptChooseView(APIView):
    def post(self, request):
        serializer = ChooseRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Validation failed", result=serializer.errors)

        data = serializer.validated_data
        user_id = data["user_id"].strip()
        prompt_text = " ".join(data["prompt"].strip().split())

        try:
            service = get_service()
            prompt_id, created = service.choose(user_id=user_id, prompt_text=prompt_text)
            return APIResponse.success(
                result={
                    "user_id": user_id,
                    "prompt_id": prompt_id,
                    "prompt": prompt_text,
                    "created": created,
                }
            )
        except ValueError as exc:
            return APIResponse.error(message=str(exc))
        except Exception as exc:
            logger.exception("rec_prompt choose failed")
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
