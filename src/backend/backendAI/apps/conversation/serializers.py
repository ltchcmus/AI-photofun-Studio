# conversation/serializers.py
from rest_framework import serializers
from uuid import uuid4


class MessageInputSerializer(serializers.Serializer):
    """Serializer for conversation messages with AI feature support"""
    
    user_id = serializers.CharField(required=True)
    prompt = serializers.CharField(required=True, allow_blank=True)
    
    # Direct image URL (alternative to selected_messages)
    image_url = serializers.URLField(
        required=False,
        help_text="Direct image URL to use (alternative to selected_messages for quick testing)"
    )
    
    # Message context for editing
    selected_messages = serializers.ListField(
        child=serializers.CharField(), 
        required=False,
        help_text="List of message IDs to use as context (for image editing features)"
    )
    
    # Additional image inputs for features requiring reference/multiple images
    additional_images = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        help_text="Additional image URLs (e.g., for style transfer reference, relight reference)"
    )
    
    # Feature-specific parameters (optional, will use defaults if not provided)
    feature_params = serializers.JSONField(
        required=False,
        help_text="""Optional parameters for specific AI features:
        - image_generation: {aspect_ratio, num_images, style}
        - upscale: {flavor}
        - reimagine: {imagination, aspect_ratio}
        - relight: {style, light_transfer_strength}
        - image_expand: {left, right, top, bottom}
        - style_transfer: {style_strength, structure_strength, is_portrait}
        """
    )

    def validate(self, attrs):
        if not attrs.get('prompt') and not attrs.get('selected_messages'):
            raise serializers.ValidationError("Either prompt or selected_messages is required.")
        return attrs



class ConversationSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    messages = MessageInputSerializer(many=True)
