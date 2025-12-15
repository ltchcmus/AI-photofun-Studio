import re
import uuid
from django.db import models
from django.utils import timezone


def extract_uuid_from_cloudinary_url(url):
    """Extract UUID from Cloudinary URL.
    Example: https://res.cloudinary.com/.../8d76bd3a-053e-4bb5-a2ab-ce147e53f40c.jpg
    Returns: 8d76bd3a-053e-4bb5-a2ab-ce147e53f40c
    """
    pattern = r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
    match = re.search(pattern, url, re.IGNORECASE)
    if match:
        return match.group(1)
    return str(uuid.uuid4())  # fallback


class ImageGallery(models.Model):
    """
    Stores user-generated images with metadata.
    Uses UUID extracted from Cloudinary URL as primary key.
    """
    image_id = models.UUIDField(
        primary_key=True,
        editable=False,
        help_text="UUID extracted from Cloudinary image URL"
    )
    user_id = models.CharField(
        max_length=255,
        db_index=True,
        help_text="User identifier"
    )
    image_url = models.URLField(
        max_length=1024,
        help_text="Full Cloudinary URL of the image"
    )
    refined_prompt = models.TextField(
        blank=True,
        null=True,
        help_text="AI-refined prompt used for generation"
    )
    intent = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Generation intent (e.g., generateImage, styleTransfer)"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata (style, model, size, etc.)"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when image was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp of last update"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Soft delete timestamp; null if not deleted"
    )

    class Meta:
        db_table = 'image_gallery'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id', '-created_at']),
            models.Index(fields=['user_id', 'deleted_at']),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.image_id}"

    def soft_delete(self):
        """Mark image as deleted without removing from database."""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        """Restore a soft-deleted image."""
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    @property
    def is_deleted(self):
        """Check if image is soft-deleted."""
        return self.deleted_at is not None

    @classmethod
    def create_from_url(cls, user_id, image_url, **kwargs):
        """Create an image record by extracting UUID from Cloudinary URL."""
        image_id = extract_uuid_from_cloudinary_url(image_url)
        return cls.objects.create(
            image_id=image_id,
            user_id=user_id,
            image_url=image_url,
            **kwargs
        )
