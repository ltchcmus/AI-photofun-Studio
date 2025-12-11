"""
Direct API endpoints for Image Generation
Support both conversation flow and direct feature access
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core import APIResponse
from .serializers import ImageGenerationInputSerializer
from apps.prompt_service.services import PromptService


class ImageGenerationView(APIView):
    """
    Direct image generation endpoint
    POST /v1/features/image-generation/
    
    Use case: User clicks "Generate Image" button directly, không qua chat
    """
    
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
            return APIResponse.bad_request(errors=serializer.errors)
        
        validated_data = serializer.validated_data
        
        # Step 1: Refine prompt (NO intent detection for direct flow)
        raw_prompt = validated_data['prompt']
        refined_prompt = PromptService.refine_only(
            prompt=raw_prompt,
            context={
                'aspect_ratio': validated_data.get('aspect_ratio'),
                'has_style_reference': bool(validated_data.get('style_reference'))
            }
        )
        
        # Step 2: Generate image (TODO: implement actual generation)
        # from .services import ImageGenerationService
        # result = ImageGenerationService.generate(
        #     prompt=refined_prompt,
        #     aspect_ratio=validated_data.get('aspect_ratio'),
        #     style_reference=validated_data.get('style_reference')
        # )
        
        # Step 3: Save to image_gallery (TODO: implement)
        # from apps.image_gallery.models import ImageGallery
        # ImageGallery.objects.create(
        #     user_id=validated_data['user_id'],
        #     image_url=result['image_url'],
        #     refined_prompt=refined_prompt,
        #     intent='image_generate',
        #     metadata={
        #         'source': 'direct_feature',
        #         'original_prompt': raw_prompt,
        #         'aspect_ratio': validated_data.get('aspect_ratio')
        #     }
        # )
        
        # Placeholder response
        return APIResponse.success(
            result={
                "message": "Image generation queued",
                "refined_prompt": refined_prompt,
                "original_prompt": raw_prompt,
                "task_id": "placeholder-task-id",
                "status": "processing"
            },
            message="Image generation started successfully"
        )
