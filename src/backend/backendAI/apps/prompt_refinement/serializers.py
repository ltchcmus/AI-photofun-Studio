"""
Serializers for Prompt Refinement service

Used for INPUT/OUTPUT validation (NO DATABASE)
"""
from rest_framework import serializers


class PromptRefinementRequestSerializer(serializers.Serializer):
    """Request to refine a prompt"""
    
    prompt = serializers.CharField(
        required=True,
        max_length=5000,
        help_text="Original prompt to refine"
    )
    context = serializers.JSONField(
        required=False,
        default=dict,
        help_text="Additional context (style, quality, etc.)"
    )
    method = serializers.ChoiceField(
        choices=['rule_based', 'llm', 'auto'],
        default='auto',
        help_text="Refinement method to use"
    )
    extract_negative = serializers.BooleanField(
        default=True,
        help_text="Whether to extract negative prompt"
    )


class PromptRefinementResponseSerializer(serializers.Serializer):
    """Response from prompt refinement"""
    
    original_prompt = serializers.CharField()
    refined_prompt = serializers.CharField()
    negative_prompt = serializers.CharField(allow_blank=True)
    
    confidence_score = serializers.FloatField()
    method_used = serializers.CharField()
    
    suggestions = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    metadata = serializers.JSONField(required=False)
    processing_time = serializers.FloatField()


class PromptValidationRequestSerializer(serializers.Serializer):
    """Request to validate a prompt"""
    
    prompt = serializers.CharField(required=True, max_length=5000)


class PromptValidationResponseSerializer(serializers.Serializer):
    """Response from prompt validation"""
    
    is_valid = serializers.BooleanField()
    error_message = serializers.CharField(allow_blank=True)
    warnings = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    suggestions = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class NegativePromptExtractionRequestSerializer(serializers.Serializer):
    """Request to extract negative prompt"""
    
    prompt = serializers.CharField(required=True, max_length=5000)


class NegativePromptExtractionResponseSerializer(serializers.Serializer):
    """Response from negative prompt extraction"""
    
    positive_prompt = serializers.CharField()
    negative_prompt = serializers.CharField()

