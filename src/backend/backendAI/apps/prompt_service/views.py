from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.response_utils import APIResponse
from .serializers import PromptRefineRequestSerializer, PromptRefineResponseSerializer
from .celery_tasks import process_prompt_task


class PromptRefineView(APIView):
    def post(self, request):
        req_ser = PromptRefineRequestSerializer(data=request.data)
        if not req_ser.is_valid():
            return APIResponse.error(message="Validation failed", result=req_ser.errors)

        task = process_prompt_task.delay(req_ser.validated_data)
        return APIResponse.success(
            result={
                "status": "PROCESSING",
                "request_id": task.id,
            },
            message="Prompt processing task started",
            status_code=status.HTTP_202_ACCEPTED
        )
