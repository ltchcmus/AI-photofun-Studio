from rest_framework import serializers
from .models import ProcessedImage


class ProcessedImageSerializer(serializers.ModelSerializer):
    """Serializer for ProcessedImage model"""
    
    class Meta:
        model = ProcessedImage
        fields = [
            'id', 'user', 'original_image', 'processed_image',
            'operation_type', 'parameters', 'status', 'error_message',
            'created_at', 'updated_at', 'processing_time'
        ]
        read_only_fields = ['id', 'status', 'error_message', 'created_at', 'updated_at', 'processing_time']


class ImageUploadSerializer(serializers.Serializer):
    """Serializer for image upload"""
    image = serializers.ImageField(required=True)
    operation_type = serializers.ChoiceField(
        choices=['resize', 'crop', 'rotate', 'filter', 'compress'],
        required=True
    )
    parameters = serializers.JSONField(required=False, default=dict)
    
    def validate_image(self, value):
        """Validate image file"""
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError("Image size should not exceed 10MB")
        
        valid_extensions = ['jpg', 'jpeg', 'png', 'webp']
        ext = value.name.split('.')[-1].lower()
        if ext not in valid_extensions:
            raise serializers.ValidationError(f"Invalid file extension. Allowed: {', '.join(valid_extensions)}")
        
        return value
