from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.core.files.base import ContentFile
from .models import ProcessedImage
from .serializers import ProcessedImageSerializer, ImageUploadSerializer
from .services import ImageProcessingService
import logging

logger = logging.getLogger(__name__)


class ImageProcessingViewSet(viewsets.ModelViewSet):
    """ViewSet for image processing operations"""
    queryset = ProcessedImage.objects.all()
    serializer_class = ProcessedImageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter queryset based on user"""
        if self.request.user.is_authenticated:
            return ProcessedImage.objects.filter(user=self.request.user)
        return ProcessedImage.objects.none()
    
    @action(detail=False, methods=['post'])
    def process(self, request):
        """Process image endpoint"""
        serializer = ImageUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        image = serializer.validated_data['image']
        operation_type = serializer.validated_data['operation_type']
        parameters = serializer.validated_data.get('parameters', {})
        
        # Create processing record
        processed_image = ProcessedImage.objects.create(
            user=request.user if request.user.is_authenticated else None,
            original_image=image,
            operation_type=operation_type,
            parameters=parameters,
            status='processing'
        )
        
        try:
            # Process image
            service = ImageProcessingService()
            result_image, processing_time = service.process_image(
                image, operation_type, parameters
            )
            
            # Save processed image
            processed_image.processed_image.save(
                f"processed_{processed_image.id}.png",
                ContentFile(result_image),
                save=True
            )
            processed_image.status = 'completed'
            processed_image.processing_time = processing_time
            processed_image.save()
            
            serializer = ProcessedImageSerializer(processed_image)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Image processing error: {str(e)}")
            processed_image.status = 'failed'
            processed_image.error_message = str(e)
            processed_image.save()
            return Response(
                {'error': 'Image processing failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
