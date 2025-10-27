from django.db import models
from django.contrib.auth.models import User


class FaceSwapRequest(models.Model):
    """Model to store face swap requests"""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='face_swaps', null=True, blank=True)
    source_image = models.ImageField(upload_to='face_swap/source/%Y/%m/%d/')
    target_image = models.ImageField(upload_to='face_swap/target/%Y/%m/%d/')
    result_image = models.ImageField(upload_to='face_swap/result/%Y/%m/%d/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processing_time = models.FloatField(null=True, blank=True)
    
    # AI model parameters
    blend_ratio = models.FloatField(default=0.8, help_text='Face blending ratio (0-1)')
    use_gpu = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Face Swap Request'
        verbose_name_plural = 'Face Swap Requests'
    
    def __str__(self):
        return f"Face Swap {self.id} - {self.status}"
