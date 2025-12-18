from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.response_utils import APIResponse
from .serializers import ImageGenerateRequestSerializer
from .celery_tasks import generate_image_task


class ImageGenerateView(APIView):
    def post(self, request):
        req_ser = ImageGenerateRequestSerializer(data=request.data)
        if not req_ser.is_valid():
            return APIResponse.error(message="Validation failed", result=req_ser.errors)

        refined_prompt = req_ser.validated_data["refined_prompt"]
        size = req_ser.validated_data.get("size", "1024x1024")
        task = generate_image_task.delay(refined_prompt, size)
        return APIResponse.success(
            result={
                "status": "PROCESSING",
                "request_id": task.id,
            },
            message="Image generation task started",
            status_code=status.HTTP_202_ACCEPTED
        )
