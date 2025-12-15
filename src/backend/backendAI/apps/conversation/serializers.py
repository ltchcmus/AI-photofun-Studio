# conversation/serializers.py
from rest_framework import serializers
from uuid import uuid4


class MessageInputSerializer(serializers.Serializer):
    user_id = serializers.CharField(required=True)
    prompt = serializers.CharField(required=True, allow_blank=True)
    selected_messages = serializers.ListField(
        child=serializers.CharField(), required=False
    )

    def validate(self, attrs):
        if not attrs.get('prompt') and not attrs.get('selected_messages'):
            raise serializers.ValidationError("Either prompt or selected_messages is required.")
        return attrs



class ConversationSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    messages = MessageInputSerializer(many=True)
