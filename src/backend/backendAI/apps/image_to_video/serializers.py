from rest_framework import serializers


IMAGE_TO_VIDEO_MODELS = [
    "wan2.2-i2v-plus",
    "wan2.6-i2v",
    "wan2.5-i2v-preview",
    "wan2.2-i2v-flash",
    "wan2.1-i2v-turbo",
    "wan2.1-i2v-plus",
]


class ImageToVideoRequestSerializer(serializers.Serializer):
    user_id = serializers.CharField(required=True, allow_blank=False)
    prompt = serializers.CharField(required=True, allow_blank=False)
    model = serializers.ChoiceField(
        choices=IMAGE_TO_VIDEO_MODELS,
        required=False,
        default="wan2.6-i2v",
    )
    image_url = serializers.URLField(required=False)
    image_data = serializers.CharField(required=False, allow_blank=False)
    image_file = serializers.ImageField(required=False)

    def validate(self, attrs):
        if not attrs.get("image_url") and not attrs.get("image_data") and not attrs.get("image_file"):
            raise serializers.ValidationError("image_url, image_data, or image_file is required")
        return attrs
