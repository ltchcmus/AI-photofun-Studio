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
            
            # Convert float (0.0-1.0) to integer (0-100) for Freepik API
            style_strength_int = int(style_strength * 100) if style_strength <= 1.0 else int(style_strength)
            structure_strength_int = int(structure_strength * 100) if structure_strength <= 1.0 else int(structure_strength)
            
            result = freepik_client.transfer_style(
                image=image_url,
                reference_image=reference_image,
                style_strength=style_strength_int,
                structure_strength=structure_strength_int,
                is_portrait=is_portrait,
                portrait_style=portrait_style,
                webhook_url=webhook_url
            )
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            logger.info(f"Style transfer task created: {data.get('task_id')}")
            
            # Upload if completed
            # Freepik returns 'generated' not 'stylized' for this endpoint
            image_urls = data.get('generated') or data.get('stylized') or []
            if data.get('status') == 'COMPLETED' and image_urls:
                logger.info(f"Style transfer completed synchronously, uploading {len(image_urls)} images...")
                uploaded_urls = self._upload_stylized_images(image_urls)
                data['uploaded_urls'] = uploaded_urls
                logger.info(f"✓ Uploaded {len(uploaded_urls)} stylized images")
                
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
                'task_id': data.get('task_id'),
                'status': data.get('status') or 'CREATED',  # Default to CREATED if missing
                'uploaded_urls': data.get('uploaded_urls', []),
                'original_image': image_url,
                'reference_image': reference_image,
                'style_strength': style_strength,
                'structure_strength': structure_strength,
                'is_portrait': is_portrait,
                'portrait_style': portrait_style or 'standard'
            }
        
        except Exception as e:
            logger.error(f"Style transfer failed: {str(e)}")
            raise StyleTransferError(f"Transfer failed: {str(e)}")
    
    def poll_task_status(self, task_id: str) -> Dict:
        """Poll style transfer task status"""
        try:
            result = freepik_client.get_task_status(task_id, endpoint='image-style-transfer')
            
            # Extract data layer
            data = result.get('data', result)
            
            # Check for images: Freepik returns 'generated' not 'stylized'
            image_urls = data.get('generated') or data.get('stylized') or []
            
            if data.get('status') == 'COMPLETED' and image_urls:
                if not data.get('uploaded_urls'):
                    logger.info(f"Uploading {len(image_urls)} stylized images...")
                    uploaded_urls = self._upload_stylized_images(image_urls)
                    data['uploaded_urls'] = uploaded_urls
                    logger.info(f"✓ Uploaded {len(uploaded_urls)} images")
            
            return {
                'task_id': task_id,
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', [])
            }
        
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
