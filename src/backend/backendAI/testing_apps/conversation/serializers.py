# conversation/serializers.py
from rest_framework import serializers
from uuid import uuid4


class MessageSerializer(serializers.Serializer):
    message_id = serializers.CharField(required=False)
    role = serializers.ChoiceField(choices=[('user', 'user'), ('assistant', 'assistant')])
    content = serializers.CharField(required=False, allow_blank=True)
    image_url = serializers.URLField(required=False, allow_blank=True)
    selected_prompts = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    metadata = serializers.DictField(required=False)

    def validate(self, attrs):
        # ensure either content or image_url exists (assistant messages may be empty initially)
        if not attrs.get('content') and not attrs.get('image_url') and attrs.get('role') == 'user':
            raise serializers.ValidationError('user messages require content or image_url')
        # assign message_id if missing
        if not attrs.get('message_id'):
            attrs['message_id'] = str(uuid4())
        return attrs


class ConversationSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    messages = MessageSerializer(many=True)
