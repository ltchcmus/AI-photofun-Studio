from django.db import models
from django.contrib.auth.models import User


class ChatSession(models.Model):
    """Model to store chat sessions"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions', null=True, blank=True)
    session_id = models.CharField(max_length=255, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Chat Session'
        verbose_name_plural = 'Chat Sessions'
    
    def __str__(self):
        return f"Session {self.session_id} - {self.user or 'Anonymous'}"


class ChatMessage(models.Model):
    """Model to store individual chat messages"""
    
    MESSAGE_TYPE = (
        ('user', 'User Message'),
        ('assistant', 'Assistant Message'),
        ('system', 'System Message'),
    )
    
    INTENT_TYPE = (
        ('image_generation', 'Image Generation'),
        ('image_edit', 'Image Editing'),
        ('face_swap', 'Face Swap'),
        ('background_removal', 'Background Removal'),
        ('general', 'General Query'),
    )
    
    STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE)
    
    # Original and refined content
    original_prompt = models.TextField(help_text='Original user input')
    refined_prompt = models.TextField(null=True, blank=True, help_text='Refined prompt by LLM')
    
    # Intent classification
    detected_intent = models.CharField(max_length=50, choices=INTENT_TYPE, null=True, blank=True)
    intent_confidence = models.FloatField(null=True, blank=True, help_text='Confidence score 0-1')
    
    # Response data
    response_text = models.TextField(null=True, blank=True)
    response_data = models.JSONField(default=dict, blank=True, help_text='Structured response data')
    
    # Processing metadata
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    error_message = models.TextField(null=True, blank=True)
    processing_time = models.FloatField(null=True, blank=True, help_text='Total processing time in seconds')
    
    # Generated content references
    generated_image = models.ImageField(upload_to='ai_gateway/generated/%Y/%m/%d/', null=True, blank=True)
    result_files = models.JSONField(default=list, blank=True, help_text='List of result file paths')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
    
    def __str__(self):
        return f"{self.message_type} - {self.detected_intent or 'Unknown'} - {self.created_at}"


class PromptTemplate(models.Model):
    """Pre-defined prompt templates for different intents"""
    
    name = models.CharField(max_length=255, unique=True)
    intent_type = models.CharField(max_length=50)
    template = models.TextField(help_text='Template with {placeholders}')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Prompt Template'
        verbose_name_plural = 'Prompt Templates'
    
    def __str__(self):
        return f"{self.name} ({self.intent_type})"
