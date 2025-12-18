"""
Remove Background Service
Business logic for background removal using Freepik Remove Background API
"""

import logging
import time
from typing import Dict
from core.freepik_client import freepik_client
from core.file_uploader import file_uploader, FileUploadError
from apps.image_gallery.services import image_gallery_service
from shared.metadata_schema import MetadataBuilder

logger = logging.getLogger(__name__)


class RemoveBackgroundError(Exception):
    """Custom exception for background removal errors"""
    pass


class RemoveBackgroundService:
    """Handle background removal workflow"""
    
    def remove_background(self, image_url: str, user_id: str) -> Dict:
        """
        Remove background from image
        
        Note: This API is SYNCHRONOUS, returns results immediately
        
        Args:
            image_url: URL of image to process
            user_id: User identifier
            
        Returns:
            {
                "no_background": "url_without_bg",
                "original": "original_url",
                "uploaded_url": "storage_url"
            }
            
        Raises:
            RemoveBackgroundError: When removal fails
        """
        try:
            logger.info(f"Removing background from: {image_url}")
            
            start_time = time.time()
            
            # Call Freepik API (synchronous)
            result = freepik_client.remove_background(image_url)
            
            processing_time = time.time() - start_time
            logger.info(f"Background removal completed in {processing_time:.2f}s")
            
            # Upload result to file service
            # Freepik returns: {url, preview, high_resolution, original}
            no_bg_url = result.get('url') or result.get('high_resolution') or result.get('no_background')
            if no_bg_url:
                uploaded_url = file_uploader.upload_from_url(no_bg_url)
                result['uploaded_url'] = uploaded_url
                logger.info(f"Uploaded result: {uploaded_url}")
                
                # Save to gallery with standardized metadata
                try:
                    metadata = MetadataBuilder.remove_background(
                        input_source="url",
                        processing_time=processing_time,
                        output_format="png",
                        has_transparency=True,
                        original_image=image_url
                    )
                    image_gallery_service.save_image(
                        user_id=user_id,
                        image_url=uploaded_url,
                        refined_prompt=None,
                        intent='remove_background',
                        metadata=metadata
                    )
                    logger.info(f"Saved to gallery for user {user_id}")
                except Exception as e:
                    logger.error(f"Failed to save to gallery: {str(e)}")
            
            return {
                'uploaded_url': result.get('uploaded_url'),
                'original_input': image_url
            }
        
        except Exception as e:
            logger.error(f"Background removal failed: {str(e)}")
            raise RemoveBackgroundError(f"Removal failed: {str(e)}")
