"""
Image Expand Service
Business logic for image expansion using Freepik Image Expand API
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


class ImageExpandError(Exception):
    """Custom exception for image expand errors"""
    pass


class ImageExpandService:
    """Handle image expansion workflow"""
    
    def __init__(self):
        self.prompt_service = PromptService()
    
    def expand_image(
        self,
        image_url: str,
        user_id: str,
        prompt: Optional[str] = None,
        left: int = 0,
        right: int = 0,
        top: int = 0,
        bottom: int = 0,
        webhook_url: Optional[str] = None
    ) -> Dict:
        """
        Expand image borders with AI fill
        
        Args:
            image_url: URL of image to expand
            user_id: User identifier
            prompt: Optional guidance for expansion
            left: Expand left by pixels
            right: Expand right by pixels
            top: Expand top by pixels
            bottom: Expand bottom by pixels
            webhook_url: Webhook for async notifications
            
        Returns:
            {
                "task_id": "uuid",
                "status": "CREATED",
                "expanded": ["url"]  # if complete
            }
            
        Raises:
            ImageExpandError: When expansion fails
        """
        try:
            # Step 1: Refine prompt if provided
            refined_prompt = None
            if prompt:
                logger.info(f"Refining expand prompt: {prompt[:50]}...")
                refined_prompt = self.prompt_service.refine_only(
                    prompt=prompt,
                    context={"feature": "image_expand", "expansion": {"left": left, "right": right, "top": top, "bottom": bottom}}
                )
                logger.info(f"Refined expand prompt: {refined_prompt[:50]}...")
            
            logger.info(f"Expanding image: left={left}, right={right}, top={top}, bottom={bottom}")
            
            # Step 2: Convert image URL to base64 (Freepik requires base64)
            from core.image_input_handler import ImageInputHandler
            image_base64 = ImageInputHandler.url_to_base64(image_url)
            
            # Step 3: Call Freepik Image Expand API
            result = freepik_client.expand_image(
                image=image_base64,
                prompt=refined_prompt,
                left=left,
                right=right,
                top=top,
                bottom=bottom,
                webhook_url=webhook_url
            )
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            task_id = data.get('task_id')
            logger.info(f"Expand task created: {task_id}")
            
            # Store task metadata in cache for later retrieval (30 min TTL)
            cache.set(f'expand_task_{task_id}', {
                'user_id': user_id,
                'original_image': image_url,
                'original_prompt': prompt,
                'refined_prompt': refined_prompt,
                'expansion_params': {
                    'left': left,
                    'right': right,
                    'top': top,
                    'bottom': bottom
                }
            }, timeout=1800)
            
            # Note: Image expand is always async, gallery save happens in poll_task_status()
            
            return {
                'task_id': task_id,
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', [])
            }
        
        except Exception as e:
            logger.error(f"Image expansion failed: {str(e)}")
            raise ImageExpandError(f"Expand failed: {str(e)}")
    
    def poll_task_status(self, task_id: str, user_id: Optional[str] = None) -> Dict:
        """Poll expand task status and save to gallery when completed"""
        try:
            # CRITICAL: Freepik endpoint for image-expand is 'image-expand/flux-pro'
            result = freepik_client.get_task_status(task_id, endpoint='image-expand/flux-pro')
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            
            # Upload generated images if completed
            if data.get('status') == 'COMPLETED' and data.get('generated'):
                if not data.get('uploaded_urls'):  # Only upload if empty
                    logger.info(f"Uploading {len(data['generated'])} expanded images...")
                    uploaded_urls = self._upload_expanded_images(data['generated'])
                    data['uploaded_urls'] = uploaded_urls
                    logger.info(f"✓ Uploaded {len(uploaded_urls)} images successfully")
                    
                    # Save to gallery if user_id provided and not already saved
                    cache_key = f'expand_saved_{task_id}'
                    if user_id and not cache.get(cache_key):
                        # Retrieve task metadata from cache
                        task_metadata = cache.get(f'expand_task_{task_id}', {})
                        
                        # Build standardized metadata
                        expansion_params = task_metadata.get('expansion_params', {})
                        metadata = MetadataBuilder.image_expand(
                            task_id=task_id,
                            expand_direction='custom',
                            expand_amount=sum(expansion_params.values()) if expansion_params else 0,
                            freepik_task_id=task_id,
                            expansion_params=expansion_params,
                            original_image=task_metadata.get('original_image'),
                            original_prompt=task_metadata.get('original_prompt'),
                            refined_prompt=task_metadata.get('refined_prompt')
                        )
                        
                        # Save to gallery
                        self._save_to_gallery(
                            user_id=user_id,
                            uploaded_urls=uploaded_urls,
                            refined_prompt=task_metadata.get('refined_prompt'),
                            intent='image_expand',
                            metadata=metadata
                        )
                        
                        # Mark as saved to prevent duplicate saves
                        cache.set(cache_key, True, timeout=3600)
                        logger.info(f"Saved {len(uploaded_urls)} expanded images to gallery")
            
            return {
                'task_id': task_id,
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', [])
            }
        
        except Exception as e:
            logger.error(f"Failed to poll expand status: {str(e)}")
            raise ImageExpandError(f"Status check failed: {str(e)}")
    
    def _upload_expanded_images(self, image_urls: list) -> list:
        """Upload expanded images to file service"""
        uploaded_urls = []
        
        for url in image_urls:
            try:
                uploaded_url = file_uploader.upload_from_url(url)
                uploaded_urls.append(uploaded_url)
                logger.info(f"Uploaded expanded image: {uploaded_url}")
            except FileUploadError as e:
                logger.error(f"Failed to upload expanded image: {str(e)}")
        
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
