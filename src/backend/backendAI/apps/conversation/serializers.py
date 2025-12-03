# conversation/serializers.py
from rest_framework import serializers
from uuid import uuid4


class MessageInputSerializer(serializers.Serializer):
    message_id = serializers.CharField(read_only=True)
    role = serializers.ChoiceField(choices=[('user', 'user'), ('system', 'system')])
    content = serializers.CharField(required=False, allow_blank=True)
    image_url = serializers.URLField(required=False, allow_blank=True)
    selected_prompts = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    metadata = serializers.DictField(required=False)

    def validate(self, attrs):
        if not attrs.get('content') and not attrs.get('image_url') and attrs.get('role') == 'user':
            raise serializers.ValidationError('user messages require content or image_url')
        return attrs

    def create(self, validated_data):
        validated_data['message_id'] = str(uuid4())
        return validated_data


class MessageSerializer(MessageInputSerializer):
    # Output-only fields populated by backend pipeline
    intent = serializers.CharField(read_only=True)
    request_id = serializers.CharField(read_only=True)
    status = serializers.ChoiceField(choices=[('PROCESSING', 'PROCESSING'), ('DONE', 'DONE')], read_only=True)



class ConversationSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    messages = MessageSerializer(many=True)
