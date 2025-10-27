from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.core.files.base import ContentFile
from .models import FaceSwapRequest
from .serializers import FaceSwapRequestSerializer, FaceSwapUploadSerializer
from .services import FaceSwapService
import logging

logger = logging.getLogger(__name__)


class FaceSwapViewSet(viewsets.ModelViewSet):
    """ViewSet for face swap operations"""
    queryset = FaceSwapRequest.objects.all()
    serializer_class = FaceSwapRequestSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter queryset based on user"""
        if self.request.user.is_authenticated:
            return FaceSwapRequest.objects.filter(user=self.request.user)
        return FaceSwapRequest.objects.none()
    
    @action(detail=False, methods=['post'])
    def swap(self, request):
        """Face swap endpoint"""
        serializer = FaceSwapUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        source_image = serializer.validated_data['source_image']
        target_image = serializer.validated_data['target_image']
        blend_ratio = serializer.validated_data.get('blend_ratio', 0.8)
        use_gpu = serializer.validated_data.get('use_gpu', True)
        
        # Create request record
        face_swap_request = FaceSwapRequest.objects.create(
            user=request.user if request.user.is_authenticated else None,
            source_image=source_image,
            target_image=target_image,
            blend_ratio=blend_ratio,
            use_gpu=use_gpu,
            status='processing'
        )
        
        try:
            # Perform face swap
            service = FaceSwapService()
            result_image, processing_time = service.swap_faces(
                source_image, target_image, blend_ratio, use_gpu
            )
            
            # Save result
            face_swap_request.result_image.save(
                f"faceswap_{face_swap_request.id}.png",
                ContentFile(result_image),
                save=True
            )
            face_swap_request.status = 'completed'
            face_swap_request.processing_time = processing_time
            face_swap_request.save()
            
            serializer = FaceSwapRequestSerializer(face_swap_request)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Face swap error: {str(e)}")
            face_swap_request.status = 'failed'
            face_swap_request.error_message = str(e)
            face_swap_request.save()
            return Response(
                {'error': 'Face swap failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
