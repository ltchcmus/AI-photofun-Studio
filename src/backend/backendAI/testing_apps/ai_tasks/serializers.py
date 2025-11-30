"""
Serializers for AI Task Management

Validation only - NO DATABASE
"""
from rest_framework import serializers


class TaskSubmitSerializer(serializers.Serializer):
    """Request to submit a new task"""
    
    task_type = serializers.ChoiceField(
        choices=[
            'image_generation',
            'face_swap',
            'background_removal',
            'object_removal',
            'style_transfer',
        ],
        required=True,
        help_text='Type of AI task to perform'
    )
    
    prompt = serializers.CharField(
        required=False,
        max_length=5000,
        allow_blank=True,
        help_text='Text prompt for generation tasks'
    )
    
    image = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Base64 encoded source image'
    )
    
    target_image = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Base64 encoded target image (for face_swap)'
    )
    
    parameters = serializers.JSONField(
        required=False,
        default=dict,
        help_text='Additional parameters for the task'
    )
    
    def validate(self, data):
        """Cross-field validation"""
        task_type = data.get('task_type')
        
        # Validate required fields based on task_type
        if task_type == 'image_generation':
            if not data.get('prompt'):
                raise serializers.ValidationError({
                    'prompt': 'Prompt is required for image_generation'
                })
        
        elif task_type == 'face_swap':
            if not data.get('image') or not data.get('target_image'):
                raise serializers.ValidationError({
                    'image': 'Both source and target images are required for face_swap',
                    'target_image': 'Both source and target images are required for face_swap'
                })
        
        elif task_type in ['background_removal', 'object_removal', 'style_transfer']:
            if not data.get('image'):
                raise serializers.ValidationError({
                    'image': f'Image is required for {task_type}'
                })
        
        return data


class TaskStatusSerializer(serializers.Serializer):
    """Response for task status"""
    
    task_id = serializers.CharField()
    status = serializers.ChoiceField(
        choices=['PENDING', 'PROCESSING', 'SUCCESS', 'FAILURE', 'REVOKED']
    )
    progress = serializers.IntegerField(
        required=False,
        min_value=0,
        max_value=100
    )
    message = serializers.CharField(required=False)
    error = serializers.CharField(required=False)
    result_available = serializers.BooleanField(default=False)


class TaskResultSerializer(serializers.Serializer):
    """Response for task result"""
    
    task_id = serializers.CharField()
    status = serializers.ChoiceField(
        choices=['PENDING', 'PROCESSING', 'SUCCESS', 'FAILURE', 'REVOKED']
    )
    result = serializers.JSONField(required=False)
    error = serializers.CharField(required=False)
    
    # Result fields
    image_data = serializers.CharField(
        required=False,
        help_text='Base64 encoded result image'
    )
    prompt_used = serializers.CharField(required=False)
    metadata = serializers.JSONField(required=False)


class TaskSubmitResponseSerializer(serializers.Serializer):
    """Response when task is submitted"""
    
    task_id = serializers.CharField(help_text='Celery task ID')
    status = serializers.CharField(help_text='Initial task status')
    message = serializers.CharField(help_text='Human readable message')
