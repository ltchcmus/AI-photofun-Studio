"""
Serializers for Image Generation service
"""
from rest_framework import serializers
from .models import ImageGenerationRequest


class ImageGenerationRequestSerializer(serializers.Serializer):
    """Request to generate an image"""
    
    prompt = serializers.CharField(
        required=True,
        max_length=2000,
        help_text="Text prompt describing desired image"
    )
    negative_prompt = serializers.CharField(
        required=False,
        default="",
        max_length=2000,
        help_text="Things to avoid in generation"
    )
    width = serializers.IntegerField(
        required=False,
        default=512,
        min_value=128,
        max_value=2048,
        help_text="Image width (must be multiple of 64)"
    )
    height = serializers.IntegerField(
        required=False,
        default=512,
        min_value=128,
        max_value=2048,
        help_text="Image height (must be multiple of 64)"
    )
    num_inference_steps = serializers.IntegerField(
        required=False,
        default=50,
        min_value=10,
        max_value=150,
        help_text="Number of denoising steps"
    )
    guidance_scale = serializers.FloatField(
        required=False,
        default=7.5,
        min_value=1.0,
        max_value=20.0,
        help_text="How closely to follow the prompt"
    )
    seed = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Random seed for reproducibility"
    )
    num_variations = serializers.IntegerField(
        required=False,
        default=1,
        min_value=1,
        max_value=4,
        help_text="Number of variations to generate"
    )


class ImageGenerationResponseSerializer(serializers.Serializer):
    """Response from image generation"""
    
    success = serializers.BooleanField()
    image_url = serializers.URLField(required=False, allow_null=True)
    request_id = serializers.UUIDField(required=False, allow_null=True)
    metadata = serializers.JSONField(required=False)
    error = serializers.CharField(required=False, allow_blank=True)


class ImageGenerationStatusSerializer(serializers.ModelSerializer):
    """Serializer for ImageGenerationRequest model"""
    
    class Meta:
        model = ImageGenerationRequest
        fields = [
            'id', 'prompt', 'negative_prompt',
            'width', 'height', 'num_inference_steps', 'guidance_scale', 'seed',
            'generated_image', 'model_used', 'processing_time',
            'status', 'error_message', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'generated_image', 'model_used', 'processing_time',
            'status', 'error_message', 'metadata', 'created_at', 'updated_at'
        ]
