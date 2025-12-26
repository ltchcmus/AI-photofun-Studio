"""
API Views for Relight feature
"""
from rest_framework.views import APIView
from rest_framework import status
from core import APIResponse
from .serializers import RelightInputSerializer
from .services import RelightService, RelightError
from core.token_decorators import track_processing_time
from core.image_input_handler import ImageInputHandler
import logging

logger = logging.getLogger(__name__)


class RelightView(APIView):
    """Relight image - POST /v1/features/relight/"""
    
    @track_processing_time(feature='relight', min_required_tokens=8)
    def post(self, request):
        serializer = RelightInputSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Validation failed", result=serializer.errors)
        
        validated_data = serializer.validated_data
        
        try:
            # Process main image input (supports base64, URL, or file upload)
            image_url, source_type = ImageInputHandler.process_image_input(
                image_data=validated_data.get('image_data'),
                image_url=validated_data.get('image_url'),
                image_file=validated_data.get('image_file')
            )
            
            # Process reference image if provided
            reference_image_url = None
            reference_source_type = None
            if any([validated_data.get('reference_image_data'), 
                    validated_data.get('reference_image_url'), 
                    validated_data.get('reference_image_file')]):
                reference_image_url, reference_source_type = ImageInputHandler.process_image_input(
                    image_data=validated_data.get('reference_image_data'),
                    image_url=validated_data.get('reference_image_url'),
                    image_file=validated_data.get('reference_image_file')
                )
            
            service = RelightService()
            result = service.relight_image(
                image_url=image_url,
                prompt=validated_data['prompt'],
                user_id=validated_data['user_id'],
                reference_image=reference_image_url,
                light_transfer_strength=validated_data.get('light_transfer_strength', 0.8),
                style=validated_data.get('style', 'standard')
            )
            
            return APIResponse.success(
                result={
                    "task_id": result['task_id'],
                    "status": result['status'],
                    "image_url": result.get('uploaded_urls', [None])[0] if result.get('uploaded_urls') else None,
                    "original_image": image_url,
                    "reference_image": reference_image_url,
                    "light_transfer_strength": validated_data.get('light_transfer_strength', 0.8),
                    "style": validated_data.get('style', 'standard')
                },
                message="Relight started. Use task_id to poll status."
            )
        
        except RelightError as e:
            logger.error(f"Relight error: {str(e)}")
            return APIResponse.error(
                message="Relight failed",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RelightStatusView(APIView):
    """Poll relight status - GET /v1/features/relight/status/<task_id>/"""
    
    def get(self, request, task_id):
        try:
            # Get user_id from query params for gallery save
            user_id = request.query_params.get('user_id')
            
            service = RelightService()
            result = service.poll_task_status(task_id, user_id=user_id)
            
            return APIResponse.success(
                result={
                    "task_id": result.get('task_id'),
                    "status": result.get('status'),
                    "image_url": result.get('uploaded_urls', [None])[0] if result.get('uploaded_urls') else None
                },
                message="Task status retrieved"
            )
        
        except RelightError as e:
            return APIResponse.error(message="Failed to get status", result=str(e))
