from rest_framework import serializers


class ImageGenerateRequestSerializer(serializers.Serializer):
    refined_prompt = serializers.CharField(required=True, allow_blank=False)
    size = serializers.CharField(required=False, allow_blank=True, default="1024x1024")


class ImageGenerateResponseSerializer(serializers.Serializer):
    request_id = serializers.CharField()
    image_base64 = serializers.CharField()
    metadata = serializers.DictField(required=False)
