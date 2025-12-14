"""
Serializers for Image Generation feature
"""
from rest_framework import serializers
from apps.intent_router.constants import AspectRatio


class ImageGenerationInputSerializer(serializers.Serializer):
    """Validate input for image generation"""
    prompt = serializers.CharField(required=True, max_length=2000)
    aspect_ratio = serializers.ChoiceField(
        choices=AspectRatio.all(),
        required=False,
        default=AspectRatio.SQUARE
    )
    
    # Style reference - support 3 input formats (all optional)
    style_reference_data = serializers.CharField(required=False, help_text="Base64 encoded style reference image")
    style_reference_url = serializers.URLField(required=False, allow_blank=True, help_text="Style reference image URL")
    style_reference_file = serializers.ImageField(required=False, help_text="Style reference file upload")
    
    user_id = serializers.CharField(required=True, max_length=255)
