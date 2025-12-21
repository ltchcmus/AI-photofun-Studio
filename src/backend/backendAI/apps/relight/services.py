"""
Relight Service
Business logic for image relighting using Freepik Relight API
"""

import logging
from typing import Dict, Optional
from django.core.cache import cache
from core.freepik_client import freepik_client
from core.file_uploader import file_uploader, FileUploadError
from apps.prompt_service.services import PromptService
from apps.image_gallery.services import image_gallery_service
from shared.metadata_schema import MetadataBuilder

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
            task_id = data.get('task_id')
            logger.info(f"Relight task created: {task_id}")
            
            # Store task metadata in cache for later retrieval (30 min TTL)
            cache.set(f'relight_task_{task_id}', {
                'user_id': user_id,
                'original_image': image_url,
                'original_prompt': prompt,
                'refined_prompt': refined_prompt,
                'style': style,
                'light_transfer_strength': light_transfer_strength
            }, timeout=1800)
            
            # Note: Relight is always async, gallery save happens in poll_task_status()
            
            return {
                'task_id': task_id,
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', [])
            }
        
        except Exception as e:
            logger.error(f"Relighting failed: {str(e)}")
            raise RelightError(f"Relight failed: {str(e)}")
    
    def poll_task_status(self, task_id: str, user_id: Optional[str] = None) -> Dict:
        """Poll relight task status and save to gallery when completed"""
        try:
            # CRITICAL: Freepik endpoint for relight is 'image-relight'
            result = freepik_client.get_task_status(task_id, endpoint='image-relight')
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            
            # Upload generated images if completed
            if data.get('status') == 'COMPLETED' and data.get('generated'):
                if not data.get('uploaded_urls'):  # Only upload if empty
                    logger.info(f"Uploading {len(data['generated'])} relit images...")
                    uploaded_urls = self._upload_relit_images(data['generated'])
                    data['uploaded_urls'] = uploaded_urls
                    logger.info(f"✓ Uploaded {len(uploaded_urls)} images successfully")
                    
                    # Save to gallery if user_id provided and not already saved
                    cache_key = f'relight_saved_{task_id}'
                    if user_id and not cache.get(cache_key):
                        # Retrieve task metadata from cache
                        task_metadata = cache.get(f'relight_task_{task_id}', {})
                        
                        # Build standardized metadata
                        metadata = MetadataBuilder.relight(
                            task_id=task_id,
                            freepik_task_id=task_id,
                            original_image=task_metadata.get('original_image'),
                            original_prompt=task_metadata.get('original_prompt'),
                            refined_prompt=task_metadata.get('refined_prompt'),
                            style=task_metadata.get('style', 'standard'),
                            light_transfer_strength=task_metadata.get('light_transfer_strength', 1.0)
                        )
                        
                        # Save to gallery
                        self._save_to_gallery(
                            user_id=user_id,
                            uploaded_urls=uploaded_urls,
                            refined_prompt=task_metadata.get('refined_prompt'),
                            intent='relight',
                            metadata=metadata
                        )
                        
                        # Mark as saved to prevent duplicate saves
                        cache.set(cache_key, True, timeout=3600)
                        logger.info(f"Saved {len(uploaded_urls)} relit images to gallery")
            
            return {
                'task_id': task_id,
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', [])
            }
        
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
