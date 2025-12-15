from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import ImageGenerateRequestSerializer
from .celery_tasks import generate_image_task


class ImageGenerateView(APIView):
    def post(self, request):
        req_ser = ImageGenerateRequestSerializer(data=request.data)
        if not req_ser.is_valid():
            return Response({"errors": req_ser.errors}, status=status.HTTP_400_BAD_REQUEST)

        refined_prompt = req_ser.validated_data["refined_prompt"]
        size = req_ser.validated_data.get("size", "1024x1024")
        task = generate_image_task.delay(refined_prompt, size)
        return Response({
            "status": "PROCESSING",
            "request_id": task.id,
        }, status=status.HTTP_202_ACCEPTED)
