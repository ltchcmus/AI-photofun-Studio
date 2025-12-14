"""
Serializers for Reimagine feature
"""
from rest_framework import serializers
from apps.intent_router.constants import AspectRatio


class ReimagineInputSerializer(serializers.Serializer):
    """Validate input for image reimagination"""
    # Support 3 input formats
    image_data = serializers.CharField(required=False, help_text="Base64 encoded image data")
    image_url = serializers.URLField(required=False, help_text="URL of image to reimagine")
    image_file = serializers.ImageField(required=False, help_text="Direct file upload")
    
    prompt = serializers.CharField(required=False, max_length=2000, allow_blank=True, help_text="Optional guidance prompt")
    imagination = serializers.ChoiceField(
        choices=['wild', 'subtle', 'vivid'],
        required=False,
        default='subtle',
        help_text="Level of imagination"
    )
    aspect_ratio = serializers.ChoiceField(
        choices=AspectRatio.all(),
        required=False,
        default=AspectRatio.SQUARE
    )
    user_id = serializers.CharField(required=True, max_length=255)
    
    def validate(self, data):
        if not any([data.get('image_data'), data.get('image_url'), data.get('image_file')]):
            raise serializers.ValidationError("At least one of image_data, image_url, or image_file is required")
        return data
