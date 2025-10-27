from rest_framework import serializers
from .models import ChatSession, ChatMessage, PromptTemplate


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for ChatSession"""
    
    class Meta:
        model = ChatSession
        fields = ['id', 'session_id', 'user', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for ChatMessage"""
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'session', 'message_type', 'original_prompt', 'refined_prompt',
            'detected_intent', 'intent_confidence', 'response_text', 'response_data',
            'status', 'error_message', 'processing_time', 'generated_image',
            'result_files', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'refined_prompt', 'detected_intent', 'intent_confidence',
            'response_text', 'response_data', 'status', 'error_message',
            'processing_time', 'generated_image', 'result_files',
            'created_at', 'updated_at'
        ]


class ChatRequestSerializer(serializers.Serializer):
    """Serializer for incoming chat requests"""
    
    session_id = serializers.CharField(required=False, allow_null=True, help_text='Session ID for conversation continuity')
    message = serializers.CharField(required=True, help_text='User message/prompt')
    image = serializers.ImageField(required=False, allow_null=True, help_text='Optional image for editing tasks')
    context = serializers.JSONField(required=False, default=dict, help_text='Additional context data')
    
    def validate_message(self, value):
        """Validate message length"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Message must be at least 3 characters long")
        if len(value) > 2000:
            raise serializers.ValidationError("Message must not exceed 2000 characters")
        return value.strip()


class ChatResponseSerializer(serializers.Serializer):
    """Serializer for chat responses"""
    
    session_id = serializers.CharField()
    message_id = serializers.IntegerField()
    
    # Intent detection results
    intent = serializers.CharField()
    confidence = serializers.FloatField()
    
    # Refined prompt
    original_prompt = serializers.CharField()
    refined_prompt = serializers.CharField()
    
    # Response
    response_text = serializers.CharField()
    response_type = serializers.CharField()  # 'text', 'image', 'error'
    
    # Generated content
    generated_image_url = serializers.CharField(required=False, allow_null=True)
    result_files = serializers.ListField(required=False, default=list)
    
    # Metadata
    processing_time = serializers.FloatField()
    timestamp = serializers.DateTimeField()


class PromptTemplateSerializer(serializers.ModelSerializer):
    """Serializer for PromptTemplate"""
    
    class Meta:
        model = PromptTemplate
        fields = '__all__'
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']
