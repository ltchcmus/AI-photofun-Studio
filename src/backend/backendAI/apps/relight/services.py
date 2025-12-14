"""
Relight Service
Business logic for image relighting using Freepik Relight API
"""

import logging
from typing import Dict, Optional
from core.freepik_client import freepik_client
from core.file_uploader import file_uploader, FileUploadError
from apps.prompt_service.services import PromptService
from apps.image_gallery.services import image_gallery_service

logger = logging.getLogger(__name__)


class RelightError(Exception):
    """Custom exception for relight errors"""
    pass


class RelightService:
    """Handle image relighting workflow"""
    
    def __init__(self):
        self.prompt_service = PromptService()
    
    def relight_image(
        self,
        image_url: str,
        prompt: str,
        user_id: str,
        reference_image: Optional[str] = None,
        light_transfer_strength: float = 0.8,
        style: str = 'standard',
        webhook_url: Optional[str] = None
    ) -> Dict:
        """
        Relight image with AI
        
        Args:
            image_url: URL of image to relight
            prompt: Lighting description
            user_id: User identifier
            reference_image: Optional reference lighting image
            light_transfer_strength: Strength of light transfer (0.0-1.0)
            style: Lighting style preset
            webhook_url: Webhook for async notifications
            
        Returns:
            {
                "task_id": "uuid",
                "status": "CREATED",
                "relit": ["url"]  # if complete
            }
            
        Raises:
            RelightError: When relighting fails
        """
        try:
            # Step 1: Refine prompt using prompt service
            logger.info(f"Refining lighting prompt: {prompt[:50]}...")
            refined_prompt = self.prompt_service.refine_only(
                prompt=prompt,
                context={"feature": "relight", "style": style}
            )
            logger.info(f"Refined lighting prompt: {refined_prompt[:50]}...")
            
            # Step 2: Call Freepik Relight API
            # Convert light_transfer_strength to integer (0-100)
            light_transfer_int = int(light_transfer_strength * 100) if light_transfer_strength <= 1.0 else int(light_transfer_strength)
            
            result = freepik_client.relight_image(
                image=image_url,
                prompt=refined_prompt,
                transfer_light_from_reference_image=reference_image,
                light_transfer_strength=light_transfer_int,
                style=style,
                webhook_url=webhook_url
            )
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            logger.info(f"Relight task created: {data.get('task_id')}")
            
            # Upload if completed
            if data.get('status') == 'COMPLETED' and data.get('relit'):
                uploaded_urls = self._upload_relit_images(data['relit'])
                data['uploaded_urls'] = uploaded_urls
                
                # Save to gallery
                self._save_to_gallery(
                    user_id=user_id,
                    uploaded_urls=uploaded_urls,
                    refined_prompt=refined_prompt,
                    intent='relight',
                    metadata={
                        'original_image': image_url,
                        'original_prompt': prompt,
                        'style': style,
                        'light_transfer_strength': light_transfer_strength
                    }
                )
            
            return {
                'task_id': data.get('task_id'),
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', []),
                'original_image': image_url,
                'original_prompt': prompt,
                'refined_prompt': refined_prompt,
                'style': style
            }
        
        except Exception as e:
            logger.error(f"Relighting failed: {str(e)}")
            raise RelightError(f"Relight failed: {str(e)}")
    
    def poll_task_status(self, task_id: str) -> Dict:
        """Poll relight task status"""
        try:
            result = freepik_client.get_task_status(task_id, endpoint='relight')
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            
            if data.get('status') == 'COMPLETED' and data.get('relit'):
                if not data.get('uploaded_urls'):  # Only upload if empty
                    logger.info(f"Uploading {len(data['relit'])} relit images...")
                    uploaded_urls = self._upload_relit_images(data['relit'])
                    data['uploaded_urls'] = uploaded_urls
                    logger.info(f"✓ Uploaded {len(uploaded_urls)} images successfully")
            
            return data
        
        except Exception as e:
            logger.error(f"Failed to poll relight status: {str(e)}")
            raise RelightError(f"Status check failed: {str(e)}")
    
    def _upload_relit_images(self, image_urls: list) -> list:
        """Upload relit images to file service"""
        uploaded_urls = []
        
        for url in image_urls:
            try:
                uploaded_url = file_uploader.upload_from_url(url)
                uploaded_urls.append(uploaded_url)
                logger.info(f"Uploaded relit image: {uploaded_url}")
            except FileUploadError as e:
                logger.error(f"Failed to upload relit image: {str(e)}")
        
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
