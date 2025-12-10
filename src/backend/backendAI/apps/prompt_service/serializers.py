from rest_framework import serializers


class PromptRefineRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=True, allow_blank=False)
    style = serializers.CharField(required=False, allow_blank=True)
    lang = serializers.CharField(required=False, allow_blank=True)
    topic = serializers.CharField(required=False, allow_blank=True)
    image_url = serializers.URLField(required=False)


class PromptRefineResponseSerializer(serializers.Serializer):
    refined_prompt = serializers.CharField()
    intent = serializers.CharField()
    keywords = serializers.ListField(child=serializers.CharField(), required=False)
    metadata = serializers.DictField(required=False)
