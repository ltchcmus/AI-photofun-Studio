"""
Serializers for Style Transfer feature
"""
from rest_framework import serializers


class StyleTransferInputSerializer(serializers.Serializer):
    """Validate input for style transfer"""
    # Main image - support 3 input formats
    image_data = serializers.CharField(required=False, help_text="Base64 encoded image data")
    image_url = serializers.URLField(required=False, help_text="URL of image to stylize")
    image_file = serializers.ImageField(required=False, help_text="Direct file upload")
    
    # Reference style image - support 3 input formats
    reference_image_data = serializers.CharField(required=False, help_text="Base64 encoded reference image")
    reference_image_url = serializers.URLField(required=False, help_text="Reference style image URL")
    reference_image_file = serializers.ImageField(required=False, help_text="Reference image file upload")
    
    # Style parameters
    style_strength = serializers.FloatField(required=False, default=0.75, min_value=0.0, max_value=1.0)
    structure_strength = serializers.FloatField(required=False, default=0.75, min_value=0.0, max_value=1.0)
    is_portrait = serializers.BooleanField(required=False, default=False)
    portrait_style = serializers.ChoiceField(
        choices=['anime', 'photographic', 'digital_art', 'comic_book', 'fantasy_art', 'line_art', 'neon_punk'],
        required=False
    )
    user_id = serializers.CharField(required=True, max_length=255)
    
    def validate(self, data):
        # Main image is required
        if not any([data.get('image_data'), data.get('image_url'), data.get('image_file')]):
            raise serializers.ValidationError("At least one of image_data, image_url, or image_file is required")
        # Reference image is required
        if not any([data.get('reference_image_data'), data.get('reference_image_url'), data.get('reference_image_file')]):
            raise serializers.ValidationError("At least one of reference_image_data, reference_image_url, or reference_image_file is required")
        return data
