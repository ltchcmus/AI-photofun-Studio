from rest_framework import serializers


class SuggestRequestSerializer(serializers.Serializer):
    user_id = serializers.CharField(required=True, allow_blank=False)
    prompt = serializers.CharField(required=False, allow_blank=True, default="")


class ChooseRequestSerializer(serializers.Serializer):
    user_id = serializers.CharField(required=True, allow_blank=False)
    prompt = serializers.CharField(required=True, allow_blank=False)
