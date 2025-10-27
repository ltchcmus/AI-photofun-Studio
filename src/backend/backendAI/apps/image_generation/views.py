"""
Image Generation Views - NO DATABASE

Stateless REST API endpoints
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .service import get_service
import logging

logger = logging.getLogger(__name__)


class ImageGenerationView(APIView):
    """Generate images from text prompts"""
    
    def post(self, request):
        """
        POST /api/v1/image-generation/generate/
        
        Body:
        {
            "prompt": "beautiful sunset",
            "negative_prompt": "blurry",
            "width": 512,
            "height": 512,
            "num_inference_steps": 30,
            "guidance_scale": 7.5
        }
        """
        try:
            data = request.data
            prompt = data.get('prompt', '')
            
            if not prompt:
                return Response(
                    {'error': 'prompt is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            service = get_service()
            result = service.generate_image(
                prompt=prompt,
                negative_prompt=data.get('negative_prompt', ''),
                width=data.get('width', 512),
                height=data.get('height', 512),
                num_inference_steps=data.get('num_inference_steps', 50),
                guidance_scale=data.get('guidance_scale', 7.5),
                seed=data.get('seed')
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Generation error: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ImageVariationsView(APIView):
    """Generate multiple variations"""
    
    def post(self, request):
        """
        POST /api/v1/image-generation/generate-variations/
        
        Body:
        {
            "prompt": "beautiful sunset",
            "num_variations": 4,
            "width": 512,
            "height": 512
        }
        """
        try:
            data = request.data
            prompt = data.get('prompt', '')
            
            if not prompt:
                return Response(
                    {'error': 'prompt is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            service = get_service()
            result = service.generate_variations(
                prompt=prompt,
                num_variations=data.get('num_variations', 4),
                width=data.get('width', 512),
                height=data.get('height', 512),
                num_inference_steps=data.get('num_inference_steps', 30)
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Variations error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
