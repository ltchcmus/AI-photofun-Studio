"""
Direct API endpoints for Upscale
"""
from rest_framework.views import APIView
from core import APIResponse
from .serializers import UpscaleInputSerializer


class UpscaleView(APIView):
    """
    Direct upscale endpoint
    POST /v1/features/upscale/
    """
    
    def post(self, request):
        """
        Upscale image
        
        Request body:
        {
            "image": "https://example.com/image.jpg",
            "flavor": "photo",
            "user_id": "user123"
        }
        """
        serializer = UpscaleInputSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.bad_request(errors=serializer.errors)
        
        # TODO: Implement upscale logic
        return APIResponse.success(
            result={"message": "Upscale queued", "task_id": "placeholder"},
            message="Upscale started successfully"
        )
