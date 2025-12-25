"""
Direct API endpoints for Image Generation
Support both conversation flow and direct feature access
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core import APIResponse
from .serializers import ImageGenerationInputSerializer
from .services import ImageGenerationService, ImageGenerationError
from .celery_tasks import generate_image_task
from core.token_decorators import require_tokens
from core.token_costs import TOKEN_COSTS
from core.image_input_handler import ImageInputHandler
from apps.prompt_service.services import PromptService
from apps.image_gallery.services import image_gallery_service
import logging

logger = logging.getLogger(__name__)


class ImageGenerationView(APIView):
    """
    Direct image generation endpoint
    POST /v1/features/image-generation/
    
    Use case: User clicks "Generate Image" button directly, không qua chat
    """
    
    @require_tokens(cost=TOKEN_COSTS['image_generation'], feature='image_generation')
    def post(self, request):
        """
        Generate image từ prompt
        
        Request body:
        {
            "prompt": "A sunset over mountains",
            "aspect_ratio": "16:9",  # optional
            "style_reference": "https://...",  # optional
            "user_id": "user123"  # required for gallery save
        }
        """
        serializer = ImageGenerationInputSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message="Validation failed", result=serializer.errors)
        
        validated_data = serializer.validated_data
        user_id = validated_data['user_id']
        original_prompt = validated_data['prompt']
        
        try:
            # Step 1: Refine prompt using PromptService
            prompt_service = PromptService()
            refined_result = prompt_service.refine_and_detect_intent(
                prompt=original_prompt,
                context={}
            )
            refined_prompt = refined_result['refined_prompt']
            
            logger.info(f"[DirectAPI] Refined prompt: {refined_prompt[:80]}...")
            
            # Process optional style reference if provided
            style_reference_url = None
            style_reference_source = None
            if any([validated_data.get('style_reference_data'), 
                    validated_data.get('style_reference_url'), 
                    validated_data.get('style_reference_file')]):
                style_reference_url, style_reference_source = ImageInputHandler.process_image_input(
                    image_data=validated_data.get('style_reference_data'),
                    image_url=validated_data.get('style_reference_url'),
                    image_file=validated_data.get('style_reference_file')
                )
            
            # Generate image using service with refined prompt
            service = ImageGenerationService()
            result = service.generate_image(
                prompt=refined_prompt,
                user_id=user_id,
                aspect_ratio=validated_data.get('aspect_ratio', 'square_1_1'),
                style_reference=style_reference_url
            )
            
            return APIResponse.success(
                result={
                    "task_id": result['task_id'],
                    "status": result['status'],
                    "refined_prompt": result.get('refined_prompt'),
                    "image_url": result.get('uploaded_urls', [None])[0] if result.get('uploaded_urls') else None,
                    "aspect_ratio": result.get('aspect_ratio', 'square_1_1')
                },
                message="Image generation started. Use task_id to poll status."
            )
        
        except ImageGenerationError as e:
            logger.error(f"Image generation error: {str(e)}")
            return APIResponse.error(
                message="Image generation failed",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        except Exception as e:
            logger.error(f"Unexpected error in image generation: {str(e)}")
            return APIResponse.error(
                message="Internal server error",
                result={"detail": str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ImageGenerationStatusView(APIView):
    """
    Poll generation task status
    GET /v1/features/image-generation/status/<task_id>/?user_id=xxx
    """
    
    def get(self, request, task_id):
        """
        Get status of generation task and save to gallery if completed
        
        URL params:
            task_id: Task UUID from Freepik
        Query params:
            user_id: User ID for gallery save (optional but recommended)
        """
        try:
            service = ImageGenerationService()
            result = service.poll_task_status(task_id)
            
            # If completed and user_id provided, save to gallery
            user_id = request.query_params.get('user_id')
            if result.get('status') == 'COMPLETED' and result.get('uploaded_urls') and user_id:
                try:
                    # Save to gallery
                    for image_url in result['uploaded_urls']:
                        image_gallery_service.save_image(
                            user_id=user_id,
                            image_url=image_url,
                            refined_prompt=result.get('prompt', 'Generated image'),
                            intent='image_generation',
                            metadata={
                                'task_id': task_id,
                                'model': result.get('model', 'realism'),
                                'aspect_ratio': result.get('aspect_ratio', '1:1')
                            }
                        )
                    logger.info(f"[DirectAPI] Saved {len(result['uploaded_urls'])} images to gallery for user {user_id}")
                except Exception as e:
                    logger.warning(f"[DirectAPI] Failed to save to gallery: {str(e)}")
            
            return APIResponse.success(
                result={
                    "task_id": result.get('task_id'),
                    "status": result.get('status'),
                    "image_url": result.get('uploaded_urls', [None])[0] if result.get('uploaded_urls') else None
                },
                message="Task status retrieved"
            )
        
        except ImageGenerationError as e:
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
