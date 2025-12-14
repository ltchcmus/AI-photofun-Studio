"""
API Views for Reimagine feature
"""
from rest_framework.views import APIView
from rest_framework import status
from core import APIResponse
from .serializers import ReimagineInputSerializer
from .services import ReimagineService, ReimagineError
from core.token_decorators import require_tokens
from core.token_costs import TOKEN_COSTS
from core.image_input_handler import ImageInputHandler
import logging

logger = logging.getLogger(__name__)


class ReimagineView(APIView):
    """Reimagine image - POST /v1/features/reimagine/"""
    
    @require_tokens(cost=TOKEN_COSTS['reimagine'], feature='reimagine')
    def post(self, request):
        serializer = ReimagineInputSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Validation failed", errors=serializer.errors)
        
        validated_data = serializer.validated_data
        
        try:
            # Process image input (supports base64, URL, or file upload)
            image_url, source_type = ImageInputHandler.process_image_input(
                image_data=validated_data.get('image_data'),
                image_url=validated_data.get('image_url'),
                image_file=validated_data.get('image_file')
            )
            
            service = ReimagineService()
            result = service.reimagine_image(
                image_url=image_url,
                user_id=validated_data['user_id'],
                prompt=validated_data.get('prompt'),
                imagination=validated_data.get('imagination', 'subtle'),
                aspect_ratio=validated_data.get('aspect_ratio', 'square_1_1')
            )
            
            return APIResponse.success(
                result={
                    "task_id": result['task_id'],
                    "status": result['status'],
                    "reimagined": result.get('reimagined', []),
                    "uploaded_urls": result.get('uploaded_urls', []),
                    "original_image": result['original_image'],
                    "imagination": result['imagination'],
                    "input_source": source_type
                },
                message="Reimagine started. Use task_id to poll status."
            )
        
        except ReimagineError as e:
            logger.error(f"Reimagine error: {str(e)}")
            return APIResponse.error(
                message="Reimagine failed",
                errors=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReimagineStatusView(APIView):
    """Poll reimagine status - GET /v1/features/reimagine/status/<task_id>/"""
    
    def get(self, request, task_id):
        try:
            service = ReimagineService()
            result = service.poll_task_status(task_id)
            
            return APIResponse.success(
                result={
                    "task_id": result.get('task_id'),
                    "status": result.get('status'),
                    "reimagined": result.get('reimagined', []),
                    "uploaded_urls": result.get('uploaded_urls', [])
                },
                message="Task status retrieved"
            )
        
        except ReimagineError as e:
            return APIResponse.error(message="Failed to get status", errors=str(e))
