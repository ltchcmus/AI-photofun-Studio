"""
Image Input Helper
Handles multiple image input formats: base64, URL, or file upload
"""

import base64
import tempfile
import os
import requests
from typing import Optional, Tuple
from django.core.files.uploadedfile import InMemoryUploadedFile
from core.file_uploader import file_uploader, FileUploadError
import logging

logger = logging.getLogger(__name__)


class ImageInputHandler:
    """
    Handle multiple image input formats and convert to URL for Freepik API
    
    Supports:
    1. Base64 encoded image (image_data)
    2. URL to image (image_url) 
    3. Django file upload (image_file)
    """
    
    @staticmethod
    def process_image_input(
        image_data: Optional[str] = None,
        image_url: Optional[str] = None,
        image_file: Optional[InMemoryUploadedFile] = None
    ) -> Tuple[str, str]:
        """
        Process image input and return URL + source type
        
        Args:
            image_data: Base64 encoded image
            image_url: Direct URL to image
            image_file: Uploaded file object
            
        Returns:
            Tuple[str, str]: (image_url, source_type)
            
        Raises:
            ValueError: If no valid input provided or processing failed
        """
        # Priority 1: Direct URL (no processing needed)
        if image_url:
            logger.info("Using direct image URL")
            return image_url, "url"
        
        # Priority 2: File upload
        if image_file:
            logger.info(f"Processing uploaded file: {image_file.name}")
            try:
                # Save temp file
                temp_path = ImageInputHandler._save_uploaded_file(image_file)
                # Upload to storage
                uploaded_url = file_uploader.upload_file(temp_path)
                # Clean up
                os.remove(temp_path)
                logger.info(f"Uploaded file to: {uploaded_url}")
                return uploaded_url, "file"
            except Exception as e:
                logger.error(f"Failed to process uploaded file: {str(e)}")
                raise ValueError(f"File upload failed: {str(e)}")
        
        # Priority 3: Base64
        if image_data:
            logger.info("Processing base64 image data")
            try:
                # Detect extension from base64 header
                extension = ImageInputHandler._detect_base64_extension(image_data)
                # Remove base64 header if present
                clean_data = ImageInputHandler._clean_base64(image_data)
                # Upload to storage
                uploaded_url = file_uploader.upload_from_base64(clean_data, extension)
                logger.info(f"Uploaded base64 image to: {uploaded_url}")
                return uploaded_url, "base64"
            except Exception as e:
                logger.error(f"Failed to process base64: {str(e)}")
                raise ValueError(f"Base64 processing failed: {str(e)}")
        
        # No valid input
        raise ValueError("No valid image input provided")
    
    @staticmethod
    def _save_uploaded_file(uploaded_file: InMemoryUploadedFile) -> str:
        """Save Django uploaded file to temp location"""
        extension = uploaded_file.name.split('.')[-1] if '.' in uploaded_file.name else 'jpg'
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{extension}') as temp_file:
            for chunk in uploaded_file.chunks():
                temp_file.write(chunk)
            return temp_file.name
    
    @staticmethod
    def _detect_base64_extension(base64_string: str) -> str:
        """Detect image extension from base64 data URI"""
        if base64_string.startswith('data:image/'):
            # Extract from data URI: data:image/png;base64,xxxxx
            mime_type = base64_string.split(';')[0].split(':')[1]
            extension_map = {
                'image/jpeg': 'jpg',
                'image/jpg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif',
                'image/webp': 'webp',
                'image/bmp': 'bmp'
            }
            return extension_map.get(mime_type, 'jpg')
        return 'jpg'
    
    @staticmethod
    def _clean_base64(base64_string: str) -> str:
        """Remove data URI header from base64 string if present"""
        if base64_string.startswith('data:image/'):
            # Remove "data:image/png;base64," prefix
            return base64_string.split(',', 1)[1]
        return base64_string
    
    @staticmethod
    def url_to_base64(image_url: str) -> str:
        """
        Download image from URL and convert to base64
        
        Args:
            image_url: URL of image to download
            
        Returns:
            Base64 encoded image string (no data URI prefix)
            
        Raises:
            ValueError: If download fails
        """
        try:
            logger.info(f"Downloading image from URL for base64 conversion: {image_url[:100]}...")
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            # Encode to base64
            image_base64 = base64.b64encode(response.content).decode('utf-8')
            logger.info(f"Converted image to base64 ({len(image_base64)} chars)")
            return image_base64
            
        except Exception as e:
            logger.error(f"Failed to convert URL to base64: {str(e)}")
            raise ValueError(f"URL to base64 conversion failed: {str(e)}")


