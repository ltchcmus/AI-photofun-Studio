from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import PromptRefineRequestSerializer, PromptRefineResponseSerializer
from .celery_tasks import process_prompt_task


class PromptRefineView(APIView):
    def post(self, request):
        req_ser = PromptRefineRequestSerializer(data=request.data)
        if not req_ser.is_valid():
            return Response({"errors": req_ser.errors}, status=status.HTTP_400_BAD_REQUEST)

        task = process_prompt_task.delay(req_ser.validated_data)
        return Response({
            "status": "PROCESSING",
            "request_id": task.id,
        }, status=status.HTTP_202_ACCEPTED)
