"""
Style Transfer Service
Business logic for style transfer using Freepik Style Transfer API
"""

import logging
from typing import Dict, Optional
from core.freepik_client import freepik_client
from core.file_uploader import file_uploader, FileUploadError
from apps.image_gallery.services import image_gallery_service

logger = logging.getLogger(__name__)


class StyleTransferError(Exception):
    """Custom exception for style transfer errors"""
    pass


class StyleTransferService:
    """Handle style transfer workflow"""
    
    def transfer_style(
        self,
        image_url: str,
        reference_image: str,
        user_id: str,
        style_strength: float = 0.75,
        structure_strength: float = 0.75,
        is_portrait: bool = False,
        portrait_style: Optional[str] = None,
        webhook_url: Optional[str] = None
    ) -> Dict:
        """
        Transfer style from reference to image
        
        Args:
            image_url: URL of image to stylize
            reference_image: Reference style image
            user_id: User identifier
            style_strength: Strength of style transfer (0.0-1.0)
            structure_strength: Preservation of original structure (0.0-1.0)
            is_portrait: Enable portrait mode
            portrait_style: Portrait style preset
            webhook_url: Webhook for async notifications
            
        Returns:
            {
                "task_id": "uuid",
                "status": "CREATED",
                "stylized": ["url"]  # if complete
            }
            
        Raises:
            StyleTransferError: When transfer fails
        """
        try:
            logger.info(f"Transferring style from reference: {reference_image[:50]}...")
            
            result = freepik_client.transfer_style(
                image=image_url,
                reference_image=reference_image,
                style_strength=style_strength,
                structure_strength=structure_strength,
                is_portrait=is_portrait,
                portrait_style=portrait_style,
                webhook_url=webhook_url
            )
            
            logger.info(f"Style transfer task created: {result.get('task_id')}")
            
            # Upload if completed
            if result.get('status') == 'COMPLETED' and result.get('stylized'):
                uploaded_urls = self._upload_stylized_images(result['stylized'])
                result['uploaded_urls'] = uploaded_urls
                
                # Save to gallery
                self._save_to_gallery(
                    user_id=user_id,
                    uploaded_urls=uploaded_urls,
                    refined_prompt=None,
                    intent='style_transfer',
                    metadata={
                        'original_image': image_url,
                        'reference_image': reference_image,
                        'style_strength': style_strength,
                        'structure_strength': structure_strength,
                        'is_portrait': is_portrait,
                        'portrait_style': portrait_style
                    }
                )
            
            return {
                'task_id': result.get('task_id'),
                'status': result.get('status'),
                'uploaded_urls': result.get('uploaded_urls', []),
                'original_image': image_url,
                'reference_image': reference_image,
                'settings': {
                    'style_strength': style_strength,
                    'structure_strength': structure_strength,
                    'is_portrait': is_portrait,
                    'portrait_style': portrait_style
                }
            }
        
        except Exception as e:
            logger.error(f"Style transfer failed: {str(e)}")
            raise StyleTransferError(f"Transfer failed: {str(e)}")
    
    def poll_task_status(self, task_id: str) -> Dict:
        """Poll style transfer task status"""
        try:
            result = freepik_client.get_task_status(task_id, endpoint='style-transfer')
            
            if result.get('status') == 'COMPLETED' and result.get('stylized'):
                if 'uploaded_urls' not in result:
                    uploaded_urls = self._upload_stylized_images(result['stylized'])
                    result['uploaded_urls'] = uploaded_urls
            
            return result
        
        except Exception as e:
            logger.error(f"Failed to poll style transfer status: {str(e)}")
            raise StyleTransferError(f"Status check failed: {str(e)}")
    
    def _upload_stylized_images(self, image_urls: list) -> list:
        """Upload stylized images to file service"""
        uploaded_urls = []
        
        for url in image_urls:
            try:
                uploaded_url = file_uploader.upload_from_url(url)
                uploaded_urls.append(uploaded_url)
                logger.info(f"Uploaded stylized image: {uploaded_url}")
            except FileUploadError as e:
                logger.error(f"Failed to upload stylized image: {str(e)}")
        
        return uploaded_urls
    
    def _save_to_gallery(self, user_id: str, uploaded_urls: list, refined_prompt: str, intent: str, metadata: dict):
        """Save images to gallery database"""
        try:
            image_gallery_service.save_multiple_images(
                user_id=user_id,
                image_urls=uploaded_urls,
                refined_prompt=refined_prompt,
                intent=intent,
                metadata=metadata
            )
            logger.info(f"Saved {len(uploaded_urls)} images to gallery for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to save to gallery: {str(e)}")
            # Don't fail the request if gallery save fails
