from rest_framework import serializers
from .models import ImageGallery


class ImageGallerySerializer(serializers.ModelSerializer):
    """Serializer for ImageGallery model."""
    is_deleted = serializers.ReadOnlyField()

    class Meta:
        model = ImageGallery
        fields = [
            'image_id',
            'user_id',
            'image_url',
            'refined_prompt',
            'intent',
            'metadata',
            'created_at',
            'updated_at',
            'deleted_at',
            'is_deleted',
        ]
        read_only_fields = ['image_id', 'created_at', 'updated_at']


class ImageGalleryCreateSerializer(serializers.Serializer):
    """Serializer for creating a new image entry."""
    user_id = serializers.CharField(required=True)
    image_url = serializers.URLField(required=True)
    refined_prompt = serializers.CharField(required=False, allow_blank=True)
    intent = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False, default=dict)

    def create(self, validated_data):
        return ImageGallery.create_from_url(**validated_data)


class ImageGalleryListSerializer(serializers.ModelSerializer):
    """Minimal serializer for list views."""
    is_deleted = serializers.ReadOnlyField()

    class Meta:
        model = ImageGallery
        fields = [
            'image_id',
            'image_url',
            'refined_prompt',
            'created_at',
            'is_deleted',
        ]
