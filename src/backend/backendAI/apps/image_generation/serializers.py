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
    style_reference = serializers.URLField(required=False, allow_blank=True)
    user_id = serializers.CharField(required=True, max_length=255)
