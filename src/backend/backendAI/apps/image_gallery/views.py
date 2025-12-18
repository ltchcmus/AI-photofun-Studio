from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from core import APIResponse, ResponseFormatter
from .models import ImageGallery
from .serializers import (
    ImageGallerySerializer,
    ImageGalleryCreateSerializer,
    ImageGalleryListSerializer
)


class ImageGalleryListView(APIView):
    """
    GET: List all images for a user (non-deleted only)
    POST: Create a new image entry
    """
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return APIResponse.error(message='user_id is required')

        images = ImageGallery.objects.filter(
            user_id=user_id,
            deleted_at__isnull=True
        )
        serializer = ImageGalleryListSerializer(images, many=True)
        return APIResponse.success(result=serializer.data)

    def post(self, request):
        serializer = ImageGalleryCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(message='Validation failed', result=serializer.errors)

        try:
            image = serializer.save()
            result_serializer = ImageGallerySerializer(image)
            return APIResponse.success(
                result=result_serializer.data,
                message='Image created successfully',
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(message=f'Failed to create image: {str(e)}')


class ImageGalleryDetailView(APIView):
    """
    GET: Retrieve a specific image by ID
    DELETE: Soft delete an image
    """
    def get(self, request, image_id):
        image = get_object_or_404(ImageGallery, image_id=image_id)
        serializer = ImageGallerySerializer(image)
        return APIResponse.success(result=serializer.data)

    def delete(self, request, image_id):
        image = get_object_or_404(ImageGallery, image_id=image_id)
        image.soft_delete()
        return APIResponse.success(message='Image deleted successfully')


class ImageGalleryDeletedListView(APIView):
    """GET: List all deleted images for a user"""
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return APIResponse.error(message='user_id is required')

        images = ImageGallery.objects.filter(
            user_id=user_id,
            deleted_at__isnull=False
        )
        serializer = ImageGalleryListSerializer(images, many=True)
        return APIResponse.success(result=serializer.data)


class ImageGalleryRestoreView(APIView):
    """POST: Restore a soft-deleted image"""
    def post(self, request, image_id):
        image = get_object_or_404(ImageGallery, image_id=image_id)
        
        if not image.is_deleted:
            return APIResponse.error(message='Image is not deleted')

        image.restore()
        serializer = ImageGallerySerializer(image)
        return APIResponse.success(
            result=serializer.data,
            message='Image restored successfully'
        )


class ImageGalleryPermanentDeleteView(APIView):
    """DELETE: Permanently delete an image from database"""
    def delete(self, request, image_id):
        image = get_object_or_404(ImageGallery, image_id=image_id)
        image.delete()
        return APIResponse.success(message='Image permanently deleted')
