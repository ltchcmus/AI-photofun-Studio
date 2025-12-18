"""
API Views for Remove Background feature
"""
from rest_framework.views import APIView
from rest_framework import status
from core import APIResponse
from .serializers import RemoveBackgroundInputSerializer
from .services import RemoveBackgroundService, RemoveBackgroundError
from core.token_decorators import require_tokens
from core.token_costs import TOKEN_COSTS
from core.image_input_handler import ImageInputHandler
import logging

logger = logging.getLogger(__name__)


class RemoveBackgroundView(APIView):
    """
    Remove background from image
    POST /v1/features/remove-background/
    """
    
    @require_tokens(cost=TOKEN_COSTS['remove_background'], feature='remove_background')
    def post(self, request):
        """
        Remove background from image
        
        Request body (3 formats supported):
        1. Base64: {"image_data": "data:image/png;base64,...", "user_id": "user123"}
        2. URL: {"image_url": "https://example.com/image.jpg", "user_id": "user123"}
        3. File upload (multipart/form-data): image_file field + user_id
        
        Note: This endpoint is SYNCHRONOUS (Freepik API returns immediately)
        """
        serializer = RemoveBackgroundInputSerializer(data=request.data)
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
            
            service = RemoveBackgroundService()
            result = service.remove_background(
                image_url=image_url,
                user_id=validated_data['user_id']
            )
            
            return APIResponse.success(
                result={
                    "image_url": result.get('uploaded_url'),
                    "input_source": source_type
                },
                message="Background removed successfully"
            )
        
        except RemoveBackgroundError as e:
            logger.error(f"Background removal error: {str(e)}")
            return APIResponse.error(
                message="Background removal failed",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
