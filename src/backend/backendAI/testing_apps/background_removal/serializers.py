from rest_framework import serializers
from .models import BackgroundRemovalRequest


class BackgroundRemovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackgroundRemovalRequest
        fields = '__all__'
        read_only_fields = ['id', 'status', 'error_message', 'result_image', 'mask_image', 'created_at', 'updated_at', 'processing_time']


class BgRemovalUploadSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True)
    return_mask = serializers.BooleanField(default=False)
    background_color = serializers.CharField(default='transparent')
