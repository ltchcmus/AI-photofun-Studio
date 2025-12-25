from rest_framework import serializers


TEXT_TO_VIDEO_MODELS = [
    "wan2.6-t2v",
]


class PromptToVideoRequestSerializer(serializers.Serializer):
    user_id = serializers.CharField(required=True, allow_blank=False)
    prompt = serializers.CharField(required=True, allow_blank=False)
    model = serializers.ChoiceField(
        choices=TEXT_TO_VIDEO_MODELS,
        required=False,
        default=TEXT_TO_VIDEO_MODELS[0],
    )
