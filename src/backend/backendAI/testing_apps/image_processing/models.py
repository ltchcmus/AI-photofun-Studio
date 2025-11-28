from django.db import models
from django.contrib.auth.models import User


class ProcessedImage(models.Model):
    """Model to store processed images metadata"""
    
    PROCESSING_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    OPERATION_TYPE = (
        ('resize', 'Resize'),
        ('crop', 'Crop'),
        ('rotate', 'Rotate'),
        ('filter', 'Filter'),
        ('compress', 'Compress'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='processed_images', null=True, blank=True)
    original_image = models.ImageField(upload_to='originals/%Y/%m/%d/')
    processed_image = models.ImageField(upload_to='processed/%Y/%m/%d/', null=True, blank=True)
    operation_type = models.CharField(max_length=50, choices=OPERATION_TYPE)
    parameters = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=PROCESSING_STATUS, default='pending')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processing_time = models.FloatField(null=True, blank=True, help_text='Processing time in seconds')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Processed Image'
        verbose_name_plural = 'Processed Images'
    
    def __str__(self):
        return f"{self.operation_type} - {self.status} - {self.created_at}"
