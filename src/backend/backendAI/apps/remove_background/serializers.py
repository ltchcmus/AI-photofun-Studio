"""
Serializers for Remove Background feature
"""
from rest_framework import serializers


class RemoveBackgroundInputSerializer(serializers.Serializer):
    """Validate input for background removal"""
    # Support 3 input formats: base64, URL, or file upload
    image_data = serializers.CharField(required=False, help_text="Base64 encoded image data")
    image_url = serializers.URLField(required=False, help_text="URL of image to remove background")
    image_file = serializers.ImageField(required=False, help_text="Direct file upload")
    user_id = serializers.CharField(required=True, max_length=255)
    
    def validate(self, data):
        if not any([data.get('image_data'), data.get('image_url'), data.get('image_file')]):
            raise serializers.ValidationError("At least one of image_data, image_url, or image_file is required")
        return data
