"""
Serializers for Upscale feature
"""
from rest_framework import serializers
from apps.intent_router.constants import UpscaleFlavor


class UpscaleInputSerializer(serializers.Serializer):
    """Validate input for upscale - supports multiple image input formats"""
    
    # Option 1: Base64 encoded image
    image_data = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Base64 encoded image (with or without data URI prefix)"
    )
    
    # Option 2: Image URL (optional if image_data or image_file provided)
    image_url = serializers.URLField(
        required=False,
        allow_blank=True,
        help_text="URL of image to upscale"
    )
    
    # Option 3: Direct file upload
    image_file = serializers.ImageField(
        required=False,
        allow_null=True,
        help_text="Direct image file upload (multipart/form-data)"
    )
    
    flavor = serializers.ChoiceField(
        choices=UpscaleFlavor.all(),
        required=True,
        help_text="sublime, photo, or photo_denoiser"
    )
    user_id = serializers.CharField(required=True, max_length=255)
    
    def validate(self, data):
        """Ensure at least one image source is provided"""
        if not any([data.get('image_data'), data.get('image_url'), data.get('image_file')]):
            raise serializers.ValidationError(
                "Must provide one of: image_data (base64), image_url, or image_file"
            )
        return data
