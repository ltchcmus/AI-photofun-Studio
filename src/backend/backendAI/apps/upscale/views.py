"""
Direct API endpoints for Upscale
"""
from rest_framework.views import APIView
from rest_framework import status
from core import APIResponse
from .serializers import UpscaleInputSerializer
from .services import UpscaleService, UpscaleError
from core.token_decorators import require_tokens
from core.token_costs import TOKEN_COSTS
from core.image_input_handler import ImageInputHandler
import logging

logger = logging.getLogger(__name__)


class UpscaleView(APIView):
    """
    Direct upscale endpoint
    POST /v1/features/upscale/
    
    Supports multiple input formats:
    1. JSON with base64: {"image_data": "data:image/png;base64,...", ...}
    2. JSON with URL: {"image_url": "https://...", ...}
    3. Multipart form-data: files={'image_file': file}
    """
    
    @require_tokens(cost=TOKEN_COSTS['upscale'], feature='upscale')
    def post(self, request):
        """
        Upscale image
        
        Request body (JSON):
        {
            "image_data": "base64...",  // OR
            "image_url": "https://...",  // OR
            "image_file": <file>,        // multipart/form-data
            "flavor": "photo",
            "user_id": "user123"
        }
        """
        serializer = UpscaleSerializer(data=request.data)
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
            logger.info(f"Image processed from source: {source_type}")
            
            # Map flavor to Freepik parameters
            flavor = validated_data.get('flavor', 'photo')
            flavor_mapping = {
                'photo': {'sharpen': 0.5, 'smart_grain': 0.2, 'ultra_detail': 0.3},
                'art': {'sharpen': 0.3, 'smart_grain': 0.0, 'ultra_detail': 0.5},
                'illustration': {'sharpen': 0.7, 'smart_grain': 0.0, 'ultra_detail': 0.4}
            }
            settings = flavor_mapping.get(flavor, flavor_mapping['photo'])
            
            service = UpscaleService()
            result = service.upscale_image(
                image_url=image_url,
                user_id=validated_data['user_id'],
                sharpen=settings['sharpen'],
                smart_grain=settings['smart_grain'],
                ultra_detail=settings['ultra_detail']
            )
            
            return APIResponse.success(
                result={
                    "task_id": result['task_id'],
                    "status": result['status']
                },
                message="Upscale started. Use task_id to poll status."
            )
        
        except UpscaleError as e:
            logger.error(f"Upscale error: {str(e)}")
            return APIResponse.error(
                message="Upscale failed",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        except Exception as e:
            logger.error(f"Unexpected error in upscale: {str(e)}")
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpscaleStatusView(APIView):
    """
    Poll upscale task status
    GET /v1/features/upscale/status/<task_id>/
    """
    
    def get(self, request, task_id):
        """Get upscale task status"""
        try:
            service = UpscaleService()
            result = service.poll_task_status(task_id)
            
            return APIResponse.success(
                result={
                    "task_id": result.get('task_id'),
                    "status": result.get('status'),
                    "image_url": result.get('uploaded_urls', [None])[0] if result.get('uploaded_urls') else None
                },
                message="Task status retrieved"
            )
        
        except UpscaleError as e:
            logger.error(f"Status polling error: {str(e)}")
            return APIResponse.error(
                message="Failed to get task status",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        except Exception as e:
            logger.error(f"Unexpected error polling status: {str(e)}")
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
