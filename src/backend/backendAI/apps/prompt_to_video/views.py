import logging

from rest_framework import status
from rest_framework.views import APIView

from core import APIResponse
from .serializers import PromptToVideoRequestSerializer
from .services import ModelStudioVideoError, PromptToVideoService

logger = logging.getLogger(__name__)


class PromptToVideoView(APIView):
    """
    Direct prompt-to-video endpoint
    POST /v1/features/prompt-to-video/
    """

    def post(self, request):
        serializer = PromptToVideoRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Validation failed", result=serializer.errors)

        data = serializer.validated_data
        user_id = data["user_id"].strip()
        prompt = data["prompt"]
        model = data["model"]

        try:
            service = PromptToVideoService()
            result = service.create_task(user_id=user_id, prompt=prompt, model=model)
            return APIResponse.success(
                result=result,
                message="Video generation started",
                status_code=status.HTTP_202_ACCEPTED,
            )
        except ModelStudioVideoError as exc:
            logger.error("Prompt-to-video error: %s", str(exc))
            return APIResponse.error(
                message="Video generation failed",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            logger.error("Unexpected prompt-to-video error: %s", str(exc))
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PromptToVideoStatusView(APIView):
    """
    Poll prompt-to-video task status
    GET /v1/features/prompt-to-video/status/<task_id>/?user_id=xxx
    """

    def get(self, request, task_id):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return APIResponse.error(message="user_id is required")

        try:
            service = PromptToVideoService()
            result = service.poll_task(task_id=task_id, user_id=user_id)
            return APIResponse.success(
                result=result,
                message="Task status retrieved",
            )
        except ModelStudioVideoError as exc:
            logger.error("Prompt-to-video status error: %s", str(exc))
            return APIResponse.error(
                message="Failed to get task status",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            logger.error("Unexpected prompt-to-video status error: %s", str(exc))
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
