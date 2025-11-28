"""
Prompt Refinement Views - NO DATABASE

Stateless REST API endpoints with INPUT VALIDATION
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .service import get_service
from .serializers import (
    PromptRefinementRequestSerializer,
    PromptValidationRequestSerializer,
    NegativePromptExtractionRequestSerializer
)
import logging

logger = logging.getLogger(__name__)


class PromptRefinementView(APIView):
    """Refine user prompts"""
    
    def post(self, request):
        """
        POST /api/v1/prompt-refinement/refine/
        
        Body:
        {
            "prompt": "a cat",
            "context": {"style": "realistic"},
            "method": "auto",
            "extract_negative": true
        }
        """
        try:
            # Validate input using serializer
            serializer = PromptRefinementRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid input', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            
            service = get_service()
            result = service.refine_prompt(
                original_prompt=validated_data['prompt'],
                context=validated_data.get('context'),
                method=validated_data.get('method', 'auto')
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
            # Validate input
            serializer = PromptValidationRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid input', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            
            service = get_service()
            result = service.validate_prompt(validated_data['prompt'])
            
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
            # Validate input
            serializer = NegativePromptExtractionRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid input', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            
            service = get_service()
            positive, negative = service.extract_negative_prompt(validated_data['prompt'])
            
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
