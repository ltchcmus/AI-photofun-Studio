"""
Serializers for Relight feature
"""
from rest_framework import serializers


class RelightInputSerializer(serializers.Serializer):
    """Validate input for image relighting"""
    # Main image - support 3 input formats
    image_data = serializers.CharField(required=False, help_text="Base64 encoded image data")
    image_url = serializers.URLField(required=False, help_text="URL of image to relight")
    image_file = serializers.ImageField(required=False, help_text="Direct file upload")
    
    # Lighting parameters
    prompt = serializers.CharField(required=True, max_length=2000, help_text="Lighting description")
    
    # Reference image - support 3 input formats (optional)
    reference_image_data = serializers.CharField(required=False, help_text="Base64 encoded reference image")
    reference_image_url = serializers.URLField(required=False, allow_blank=True, help_text="Reference lighting image URL")
    reference_image_file = serializers.ImageField(required=False, help_text="Reference image file upload")
    
    light_transfer_strength = serializers.FloatField(required=False, default=0.8, min_value=0.0, max_value=1.0)
    style = serializers.ChoiceField(
        choices=['standard', 'darker_but_realistic', 'clean', 'smooth', 'cinematic'],
        required=False,
        default='standard'
    )
    user_id = serializers.CharField(required=True, max_length=255)
    
    def validate(self, data):
        # At least one main image format is required
        if not any([data.get('image_data'), data.get('image_url'), data.get('image_file')]):
            raise serializers.ValidationError("At least one of image_data, image_url, or image_file is required")
        return data
