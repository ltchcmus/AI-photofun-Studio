"""
Prompt Refinement Views - NO DATABASE

Stateless REST API endpoints
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .service import get_service
import logging

logger = logging.getLogger(__name__)


class PromptRefinementView(APIView):
    """Refine user prompts"""
    
    def post(self, request):
        """
        POST /api/v1/prompt-refinement/refine/
        
        Body:
        {
            "original_prompt": "a cat",
            "context": {"style": "realistic"},
            "method": "auto"
        }
        """
        try:
            data = request.data
            original_prompt = data.get('original_prompt', '')
            
            if not original_prompt:
                return Response(
                    {'error': 'original_prompt is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            service = get_service()
            result = service.refine_prompt(
                original_prompt=original_prompt,
                context=data.get('context'),
                method=data.get('method', 'auto')
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Refinement error: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PromptValidationView(APIView):
    """Validate prompts"""
    
    def post(self, request):
        """
        POST /api/v1/prompt-refinement/validate/
        
        Body:
        {
            "prompt": "beautiful sunset"
        }
        """
        try:
            prompt = request.data.get('prompt', '')
            
            if not prompt:
                return Response(
                    {'error': 'prompt is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            service = get_service()
            result = service.validate_prompt(prompt)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExtractNegativePromptView(APIView):
    """Extract negative prompt components"""
    
    def post(self, request):
        """
        POST /api/v1/prompt-refinement/extract-negative/
        
        Body:
        {
            "prompt": "beautiful cat, NOT blurry"
        }
        """
        try:
            prompt = request.data.get('prompt', '')
            
            if not prompt:
                return Response(
                    {'error': 'prompt is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            service = get_service()
            positive, negative = service.extract_negative_prompt(prompt)
            
            return Response({
                'positive_prompt': positive,
                'negative_prompt': negative
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Extraction error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
