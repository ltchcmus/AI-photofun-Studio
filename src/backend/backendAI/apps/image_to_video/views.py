import logging

from rest_framework import status
from rest_framework.views import APIView
from django.utils.decorators import method_decorator

from core import APIResponse
from core.token_decorators import track_processing_time
from core.auth import require_role
from .serializers import ImageToVideoRequestSerializer
from .services import ModelStudioVideoError, ImageToVideoService

logger = logging.getLogger(__name__)


@method_decorator(require_role('ADMIN', 'PREMIUM'), name='dispatch')
class ImageToVideoView(APIView):
    """
    Direct image-to-video endpoint
    POST /v1/features/image-to-video/
    Requires: ADMIN or PREMIUM role
    """

    @track_processing_time(feature='image_to_video', min_required_tokens=20)
    def post(self, request):
        serializer = ImageToVideoRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Validation failed", result=serializer.errors)

        data = serializer.validated_data
        user_id = data["user_id"].strip()
        prompt = data["prompt"]
        model = data["model"]

        try:
            service = ImageToVideoService()
            result = service.create_task(
                user_id=user_id,
                prompt=prompt,
                model=model,
                image_data=data.get("image_data"),
                image_url=data.get("image_url"),
                image_file=data.get("image_file"),
            )
            return APIResponse.success(
                result=result,
                message="Video generation started",
                status_code=status.HTTP_202_ACCEPTED,
            )
        except ModelStudioVideoError as exc:
            logger.error("Image-to-video error: %s", str(exc))
            return APIResponse.error(
                message="Video generation failed",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            logger.error("Unexpected image-to-video error: %s", str(exc))
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(require_role('ADMIN', 'PREMIUM'), name='dispatch')
class ImageToVideoStatusView(APIView):
    """
    Poll image-to-video task status
    GET /v1/features/image-to-video/status/<task_id>/?user_id=xxx
    Requires: ADMIN or PREMIUM role
    """

    def get(self, request, task_id):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return APIResponse.error(message="user_id is required")

        try:
            service = ImageToVideoService()
            result = service.poll_task(task_id=task_id, user_id=user_id)
            return APIResponse.success(
                result=result,
                message="Task status retrieved",
            )
        except ModelStudioVideoError as exc:
            logger.error("Image-to-video status error: %s", str(exc))
            return APIResponse.error(
                message="Failed to get task status",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            logger.error("Unexpected image-to-video status error: %s", str(exc))
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(exc)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
