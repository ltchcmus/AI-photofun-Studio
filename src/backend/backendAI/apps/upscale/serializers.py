"""
Serializers for Upscale feature
"""
from rest_framework import serializers
from apps.intent_router.constants import UpscaleFlavor


class UpscaleInputSerializer(serializers.Serializer):
    """Validate input for upscale"""
    image = serializers.URLField(required=True, help_text="Image URL or base64")
    flavor = serializers.ChoiceField(
        choices=UpscaleFlavor.all(),
        required=True,
        help_text="sublime, photo, or photo_denoiser"
    )
    user_id = serializers.CharField(required=True, max_length=255)
