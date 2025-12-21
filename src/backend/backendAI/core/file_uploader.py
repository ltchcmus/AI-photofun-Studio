"""
File Upload Utility - Upload images to file-service-cdal.onrender.com

This service is used to store generated images and get URLs for database storage.

Usage:
    from core.file_uploader import file_uploader
    
    # Upload from local file
    url = file_uploader.upload_file("/path/to/image.jpg")
    
    # Upload from URL (download first, then upload)
    url = file_uploader.upload_from_url("https://example.com/image.jpg")
    
    # Upload from base64
    url = file_uploader.upload_from_base64(base64_string, extension="jpg")
"""

import requests
import uuid
import logging
import base64
import tempfile
import os
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class FileUploadError(Exception):
    """Custom exception for file upload errors"""
    pass


class FileUploader:
    """
    Upload images to file service
    Service URL: https://file-service-cdal.onrender.com
    """
    
    UPLOAD_URL = "https://file-service-cdal.onrender.com/api/v1/file/uploads"
    
    def __init__(self):
        self.timeout = getattr(settings, 'FILE_UPLOAD_TIMEOUT', 60)  # Increased for large upscaled images
    
    def upload_file(self, file_path: str, custom_id: Optional[str] = None) -> str:
        """
        Upload file from local path
        
        Args:
            file_path: Path to local file
            custom_id: Optional custom UUID (if not provided, generates new one)
            
        Returns:
            URL of uploaded file
            
        Raises:
            FileUploadError: When upload fails
        """
        # Generate UUID if not provided
        file_id = custom_id or str(uuid.uuid4())
        
        # Prepare form data
        data = {"id": file_id}
        
        try:
            with open(file_path, 'rb') as f:
                files = {"image": f}
                response = requests.post(
                    self.UPLOAD_URL,
                    data=data,
                    files=files,
                    timeout=self.timeout
                )
                response.raise_for_status()
            
            result = response.json()
            logger.info(f"File uploaded successfully: {file_id}")
            logger.info(f"Upload response: {result}")
            
            # Return URL from response - check multiple possible locations
            uploaded_url = (
                result.get('url') or 
                result.get('file_url') or 
                result.get('data', {}).get('url') or
                result.get('result', {}).get('image')  # File service uses this structure
            )
            
            if not uploaded_url:
                logger.error(f"No URL found in upload response: {result}")
                raise FileUploadError(f"Upload response missing URL field")
            
            return uploaded_url
            
        except requests.exceptions.Timeout:
            logger.error(f"File upload timeout for: {file_path}")
            raise FileUploadError("File upload timeout")
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"File upload HTTP error: {e.response.status_code} - {e.response.text}")
            raise FileUploadError(f"File upload failed: {e.response.status_code}")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"File upload request failed: {str(e)}")
            raise FileUploadError(f"File upload unavailable: {str(e)}")
        
        except Exception as e:
            logger.error(f"Unexpected error during file upload: {str(e)}")
            raise FileUploadError(f"File upload error: {str(e)}")
    
    def upload_from_url(self, image_url: str, custom_id: Optional[str] = None) -> str:
        """
        Download image from URL, then upload to file service
        
        Args:
            image_url: URL of image to download and upload
            custom_id: Optional custom UUID
            
        Returns:
            URL of uploaded file
            
        Raises:
            FileUploadError: When download or upload fails
        """
        try:
            # Download image
            logger.info(f"Downloading image from: {image_url}")
            response = requests.get(image_url, timeout=60, stream=True)  # Increased timeout for large images
            response.raise_for_status()
            
            # Detect file extension from URL or content-type
            extension = self._detect_extension(image_url, response.headers.get('content-type'))
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{extension}') as temp_file:
                temp_file.write(response.content)
                temp_path = temp_file.name
            
            try:
                # Upload temp file
                uploaded_url = self.upload_file(temp_path, custom_id)
                return uploaded_url
            finally:
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download image from URL: {str(e)}")
            raise FileUploadError(f"Image download failed: {str(e)}")
    
    def upload_from_base64(
        self, 
        base64_string: str, 
        extension: str = "jpg",
        custom_id: Optional[str] = None
    ) -> str:
        """
        Decode base64 image and upload
        
        Args:
            base64_string: Base64 encoded image
            extension: File extension (jpg, png, webp, etc.)
            custom_id: Optional custom UUID
            
        Returns:
            URL of uploaded file
            
        Raises:
            FileUploadError: When decode or upload fails
        """
        try:
            # Decode base64
            image_data = base64.b64decode(base64_string)
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{extension}') as temp_file:
                temp_file.write(image_data)
                temp_path = temp_file.name
            
            try:
                # Upload temp file
                uploaded_url = self.upload_file(temp_path, custom_id)
                return uploaded_url
            finally:
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        except Exception as e:
            logger.error(f"Failed to decode/upload base64 image: {str(e)}")
            raise FileUploadError(f"Base64 upload failed: {str(e)}")
    
    def _detect_extension(self, url: str, content_type: Optional[str]) -> str:
        """
        Detect file extension from URL or content-type
        
        Args:
            url: Image URL
            content_type: HTTP content-type header
            
        Returns:
            File extension (without dot)
        """
        # Try to get from URL first
        if '.' in url:
            ext = url.split('.')[-1].split('?')[0].lower()
            if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']:
                return ext
        
        # Try to get from content-type
        if content_type:
            content_type_map = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif',
                'image/webp': 'webp',
                'image/bmp': 'bmp'
            }
            return content_type_map.get(content_type, 'jpg')
        
        # Default to jpg
        return 'jpg'


# Singleton instance
file_uploader = FileUploader()
