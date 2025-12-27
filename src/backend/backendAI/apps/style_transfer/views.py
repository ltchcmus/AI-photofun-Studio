"""
API Views for Style Transfer feature
"""
from rest_framework.views import APIView
from rest_framework import status
from core import APIResponse
from .serializers import StyleTransferInputSerializer
from .services import StyleTransferService, StyleTransferError
from core.token_decorators import track_processing_time
from core.image_input_handler import ImageInputHandler
import logging

logger = logging.getLogger(__name__)


class StyleTransferView(APIView):
    """Style transfer - POST /v1/features/style-transfer/"""
    
    @track_processing_time(feature='style_transfer', min_required_tokens=12)
    def post(self, request):
        serializer = StyleTransferInputSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Validation failed", result=serializer.errors)
        
        validated_data = serializer.validated_data
        
        try:
            # Process main image input
            image_url, source_type = ImageInputHandler.process_image_input(
                image_data=validated_data.get('image_data'),
                image_url=validated_data.get('image_url'),
                image_file=validated_data.get('image_file')
            )
            
            # Process reference image input
            reference_image_url, reference_source_type = ImageInputHandler.process_image_input(
                image_data=validated_data.get('reference_image_data'),
                image_url=validated_data.get('reference_image_url'),
                image_file=validated_data.get('reference_image_file')
            )
            
            service = StyleTransferService()
            result = service.transfer_style(
                image_url=image_url,
                reference_image=reference_image_url,
                user_id=validated_data['user_id'],
                style_strength=validated_data.get('style_strength', 0.75),
                structure_strength=validated_data.get('structure_strength', 0.75),
                is_portrait=validated_data.get('is_portrait', False),
                portrait_style=validated_data.get('portrait_style')
            )
            
            return APIResponse.success(
                result={
                    "task_id": result['task_id'],
                    "status": result.get('status', 'CREATED'),
                    "image_url": result.get('uploaded_urls', [None])[0] if result.get('uploaded_urls') else None,
                    "original_image": result.get('original_image'),
                    "reference_image": result.get('reference_image'),
                    "style_strength": result.get('style_strength', 0.75),
                    "structure_strength": result.get('structure_strength', 0.75),
                    "is_portrait": result.get('is_portrait', False),
                    "portrait_style": result.get('portrait_style', 'standard')
                },
                message="Style transfer started. Use task_id to poll status."
            )
        
        except StyleTransferError as e:
            logger.error(f"Style transfer error: {str(e)}")
            return APIResponse.error(
                message="Style transfer failed",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StyleTransferStatusView(APIView):
    """Poll style transfer status - GET /v1/features/style-transfer/status/<task_id>/"""
    
    def get(self, request, task_id):
        try:
            service = StyleTransferService()
            result = service.poll_task_status(task_id)
            
            return APIResponse.success(
                result={
                    "task_id": result.get('task_id'),
                    "status": result.get('status'),
                    "image_url": result.get('uploaded_urls', [None])[0] if result.get('uploaded_urls') else None
                },
                message="Task status retrieved"
            )
        
        except StyleTransferError as e:
            return APIResponse.error(message="Failed to get status", result=str(e))
