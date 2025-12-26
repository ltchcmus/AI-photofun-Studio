"""
API Views for Image Expand feature
"""
from rest_framework.views import APIView
from rest_framework import status
from core import APIResponse
from .serializers import ImageExpandInputSerializer
from .services import ImageExpandService, ImageExpandError
from core.token_decorators import track_processing_time
from core.image_input_handler import ImageInputHandler
import logging

logger = logging.getLogger(__name__)


class ImageExpandView(APIView):
    """Expand image - POST /v1/features/image-expand/"""
    
    @track_processing_time(feature='image_expand', min_required_tokens=10)
    def post(self, request):
        serializer = ImageExpandInputSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Validation failed", result=serializer.errors)
        
        validated_data = serializer.validated_data
        
        try:
            # Process image input (supports base64, URL, or file upload)
            image_url, source_type = ImageInputHandler.process_image_input(
                image_data=validated_data.get('image_data'),
                image_url=validated_data.get('image_url'),
                image_file=validated_data.get('image_file')
            )
            
            service = ImageExpandService()
            result = service.expand_image(
                image_url=image_url,
                user_id=validated_data['user_id'],
                prompt=validated_data.get('prompt'),
                left=validated_data.get('left', 0),
                right=validated_data.get('right', 0),
                top=validated_data.get('top', 0),
                bottom=validated_data.get('bottom', 0)
            )
            
            return APIResponse.success(
                result={
                    "task_id": result['task_id'],
                    "status": result['status'],
                    "image_url": result.get('uploaded_urls', [None])[0] if result.get('uploaded_urls') else None,
                    "original_image": image_url,
                    "left": validated_data.get('left', 0),
                    "right": validated_data.get('right', 0),
                    "top": validated_data.get('top', 0),
                    "bottom": validated_data.get('bottom', 0)
                },
                message="Image expand started. Use task_id to poll status."
            )
        
        except ImageExpandError as e:
            logger.error(f"Expand error: {str(e)}")
            return APIResponse.error(
                message="Expand failed",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ImageExpandStatusView(APIView):
    """Poll expand status - GET /v1/features/image-expand/status/<task_id>/"""
    
    def get(self, request, task_id):
        try:
            # Get user_id from query params for gallery save
            user_id = request.query_params.get('user_id')
            
            service = ImageExpandService()
            result = service.poll_task_status(task_id, user_id=user_id)
            
            return APIResponse.success(
                result={
                    "task_id": result.get('task_id'),
                    "status": result.get('status'),
                    "image_url": result.get('uploaded_urls', [None])[0] if result.get('uploaded_urls') else None
                },
                message="Task status retrieved"
            )
        
        except ImageExpandError as e:
            return APIResponse.error(message="Failed to get status", result=str(e))
