"""
Serializers for Image Expand feature
"""
from rest_framework import serializers


class ImageExpandInputSerializer(serializers.Serializer):
    """Validate input for image expansion"""
    # Support 3 input formats
    image_data = serializers.CharField(required=False, help_text="Base64 encoded image data")
    image_url = serializers.URLField(required=False, help_text="URL of image to expand")
    image_file = serializers.ImageField(required=False, help_text="Direct file upload")
    
    prompt = serializers.CharField(required=False, max_length=2000, allow_blank=True, help_text="Guidance for expansion")
    left = serializers.IntegerField(required=False, default=0, min_value=0, help_text="Expand left by pixels")
    right = serializers.IntegerField(required=False, default=0, min_value=0, help_text="Expand right by pixels")
    top = serializers.IntegerField(required=False, default=0, min_value=0, help_text="Expand top by pixels")
    bottom = serializers.IntegerField(required=False, default=0, min_value=0, help_text="Expand bottom by pixels")
    user_id = serializers.CharField(required=True, max_length=255)
    
    def validate(self, data):
        """Ensure at least one image format and one direction is specified"""
        if not any([data.get('image_data'), data.get('image_url'), data.get('image_file')]):
            raise serializers.ValidationError("At least one of image_data, image_url, or image_file is required")
        if not any([data.get('left'), data.get('right'), data.get('top'), data.get('bottom')]):
            raise serializers.ValidationError("At least one expansion direction must be specified")
        return data
