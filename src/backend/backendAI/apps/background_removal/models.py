from django.db import models
from django.contrib.auth.models import User


class BackgroundRemovalRequest(models.Model):
    """Model to store background removal requests"""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bg_removals', null=True, blank=True)
    original_image = models.ImageField(upload_to='bg_removal/original/%Y/%m/%d/')
    result_image = models.ImageField(upload_to='bg_removal/result/%Y/%m/%d/', null=True, blank=True)
    mask_image = models.ImageField(upload_to='bg_removal/mask/%Y/%m/%d/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processing_time = models.FloatField(null=True, blank=True)
    
    # Options
    return_mask = models.BooleanField(default=False)
    background_color = models.CharField(max_length=20, default='transparent', help_text='transparent, white, black, or hex color')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Background Removal Request'
        verbose_name_plural = 'Background Removal Requests'
    
    def __str__(self):
        return f"BG Removal {self.id} - {self.status}"
