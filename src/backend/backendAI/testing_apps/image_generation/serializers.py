"""
Serializers for Image Generation service

Used for INPUT/OUTPUT validation (NO DATABASE)
"""
from rest_framework import serializers


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

