from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.core.files.base import ContentFile
from .models import BackgroundRemovalRequest
from .serializers import BackgroundRemovalSerializer, BgRemovalUploadSerializer
from .services import BackgroundRemovalService
import logging

logger = logging.getLogger(__name__)


class BackgroundRemovalViewSet(viewsets.ModelViewSet):
    queryset = BackgroundRemovalRequest.objects.all()
    serializer_class = BackgroundRemovalSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return BackgroundRemovalRequest.objects.filter(user=self.request.user)
        return BackgroundRemovalRequest.objects.none()
    
    @action(detail=False, methods=['post'])
    def remove(self, request):
        """Background removal endpoint"""
        serializer = BgRemovalUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        image = serializer.validated_data['image']
        return_mask = serializer.validated_data.get('return_mask', False)
        background_color = serializer.validated_data.get('background_color', 'transparent')
        
        bg_request = BackgroundRemovalRequest.objects.create(
            user=request.user if request.user.is_authenticated else None,
            original_image=image,
            return_mask=return_mask,
            background_color=background_color,
            status='processing'
        )
        
        try:
            service = BackgroundRemovalService()
            result_image, mask_image, processing_time = service.remove_background(
                image, return_mask, background_color
            )
            
            bg_request.result_image.save(
                f"bg_removed_{bg_request.id}.png",
                ContentFile(result_image),
                save=False
            )
            
            if mask_image:
                bg_request.mask_image.save(
                    f"mask_{bg_request.id}.png",
                    ContentFile(mask_image),
                    save=False
                )
            
            bg_request.status = 'completed'
            bg_request.processing_time = processing_time
            bg_request.save()
            
            serializer = BackgroundRemovalSerializer(bg_request)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Background removal error: {str(e)}")
            bg_request.status = 'failed'
            bg_request.error_message = str(e)
            bg_request.save()
            return Response(
                {'error': 'Background removal failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
