"""
File handling utilities for image processing
"""
import os
import uuid
import logging
from PIL import Image
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


class FileHandler:
    """Utility class for file operations"""
    
    @staticmethod
    def validate_image(image_file, max_size_mb=10, allowed_formats=None):
        """
        Validate uploaded image
        
        Args:
            image_file: Uploaded image file
            max_size_mb: Maximum file size in MB
            allowed_formats: List of allowed image formats
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if allowed_formats is None:
            allowed_formats = ['JPEG', 'PNG', 'WEBP', 'BMP']
        
        # Check file size
        max_size_bytes = max_size_mb * 1024 * 1024
        if image_file.size > max_size_bytes:
            return False, f"File size exceeds {max_size_mb}MB limit"
        
        try:
            # Check if it's a valid image
            img = Image.open(image_file)
            img.verify()
            
            # Check format
            if img.format not in allowed_formats:
                return False, f"Invalid format. Allowed: {', '.join(allowed_formats)}"
            
            return True, None
            
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"
    
    @staticmethod
    def save_temp_file(file_content, extension='png'):
        """
        Save temporary file
        
        Args:
            file_content: File content bytes
            extension: File extension
            
        Returns:
            str: Path to saved file
        """
        filename = f"temp_{uuid.uuid4().hex}.{extension}"
        filepath = os.path.join('temp', filename)
        
        saved_path = default_storage.save(filepath, ContentFile(file_content))
        return saved_path
    
    @staticmethod
    def delete_file(filepath):
        """Delete file from storage"""
        try:
            if default_storage.exists(filepath):
                default_storage.delete(filepath)
                logger.info(f"Deleted file: {filepath}")
        except Exception as e:
            logger.error(f"Error deleting file {filepath}: {str(e)}")
    
    @staticmethod
    def get_image_info(image_file):
        """
        Get image metadata
        
        Returns:
            dict: Image information (width, height, format, mode, size)
        """
        try:
            img = Image.open(image_file)
            return {
                'width': img.width,
                'height': img.height,
                'format': img.format,
                'mode': img.mode,
                'size': image_file.size,
            }
        except Exception as e:
            logger.error(f"Error getting image info: {str(e)}")
            return {}
    
    @staticmethod
    def resize_if_large(image, max_dimension=2048):
        """
        Resize image if larger than max dimension
        
        Args:
            image: PIL Image object
            max_dimension: Maximum width or height
            
        Returns:
            PIL Image: Resized image
        """
        if image.width > max_dimension or image.height > max_dimension:
            image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            logger.info(f"Resized image to fit {max_dimension}px")
        return image
