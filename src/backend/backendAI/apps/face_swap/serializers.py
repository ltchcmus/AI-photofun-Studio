from rest_framework import serializers
from .models import FaceSwapRequest


class FaceSwapRequestSerializer(serializers.ModelSerializer):
    """Serializer for FaceSwapRequest model"""
    
    class Meta:
        model = FaceSwapRequest
        fields = [
            'id', 'user', 'source_image', 'target_image', 'result_image',
            'status', 'error_message', 'created_at', 'updated_at',
            'processing_time', 'blend_ratio', 'use_gpu'
        ]
        read_only_fields = ['id', 'status', 'error_message', 'result_image', 'created_at', 'updated_at', 'processing_time']


class FaceSwapUploadSerializer(serializers.Serializer):
    """Serializer for face swap upload"""
    source_image = serializers.ImageField(required=True, help_text='Image containing the face to extract')
    target_image = serializers.ImageField(required=True, help_text='Image where the face will be placed')
    blend_ratio = serializers.FloatField(default=0.8, min_value=0.0, max_value=1.0)
    use_gpu = serializers.BooleanField(default=True)
    
    def validate(self, data):
        """Validate images"""
        for field in ['source_image', 'target_image']:
            image = data[field]
            max_size = 10 * 1024 * 1024  # 10MB
            if image.size > max_size:
                raise serializers.ValidationError({field: "Image size should not exceed 10MB"})
            
            valid_extensions = ['jpg', 'jpeg', 'png']
            ext = image.name.split('.')[-1].lower()
            if ext not in valid_extensions:
                raise serializers.ValidationError({field: f"Invalid file extension. Allowed: {', '.join(valid_extensions)}"})
        
        return data
