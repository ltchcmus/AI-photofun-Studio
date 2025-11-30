"""
Image Generation Views - NO DATABASE

Stateless REST API endpoints with INPUT VALIDATION
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .service import get_service
from .serializers import ImageGenerationRequestSerializer
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
            # Validate input using serializer
            serializer = ImageGenerationRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid input', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            
            service = get_service()
            result = service.generate_image(
                prompt=validated_data['prompt'],
                negative_prompt=validated_data.get('negative_prompt', ''),
                width=validated_data.get('width', 512),
                height=validated_data.get('height', 512),
                num_inference_steps=validated_data.get('num_inference_steps', 50),
                guidance_scale=validated_data.get('guidance_scale', 7.5),
                seed=validated_data.get('seed')
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
            # Validate input using serializer
            serializer = ImageGenerationRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid input', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            
            service = get_service()
            result = service.generate_variations(
                prompt=validated_data['prompt'],
                num_variations=validated_data.get('num_variations', 4),
                width=validated_data.get('width', 512),
                height=validated_data.get('height', 512),
                num_inference_steps=validated_data.get('num_inference_steps', 30)
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Variations error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
