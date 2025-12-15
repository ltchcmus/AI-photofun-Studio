"""
Reimagine Service
Business logic for image reimagination using Freepik Reimagine Flux API
"""

import logging
from typing import Dict, Optional
from core.freepik_client import freepik_client
from core.file_uploader import file_uploader, FileUploadError
from apps.prompt_service.services import PromptService
from apps.image_gallery.services import image_gallery_service

logger = logging.getLogger(__name__)


class ReimagineError(Exception):
    """Custom exception for reimagine errors"""
    pass


class ReimagineService:
    """Handle image reimagination workflow"""
    
    def __init__(self):
        self.prompt_service = PromptService()
    
    def reimagine_image(
        self,
        image_url: str,
        user_id: str,
        prompt: Optional[str] = None,
        imagination: str = 'subtle',
        aspect_ratio: str = 'square_1_1',
        webhook_url: Optional[str] = None
    ) -> Dict:
        """
        Reimagine image with AI
        
        Args:
            image_url: URL of image to reimagine
            user_id: User identifier
            prompt: Optional guidance prompt
            imagination: Level of imagination (wild, subtle, vivid)
            aspect_ratio: Output aspect ratio
            webhook_url: Webhook for async notifications
            
        Returns:
            {
                "task_id": "uuid",
                "status": "CREATED",
                "reimagined": ["url"]  # if complete
            }
            
        Raises:
            ReimagineError: When reimagination fails
        """
        try:
            # Step 1: Refine prompt if provided
            refined_prompt = None
            if prompt:
                logger.info(f"Refining reimagine prompt: {prompt[:50]}...")
                refined_prompt = self.prompt_service.refine_only(
                    prompt=prompt,
                    context={"feature": "reimagine", "imagination": imagination}
                )
                logger.info(f"Refined reimagine prompt: {refined_prompt[:50]}...")
            
            logger.info(f"Reimagining image with imagination={imagination}")
            
            # Step 2: Convert aspect ratio to Freepik format
            from apps.intent_router.constants import AspectRatio
            freepik_aspect_ratio = AspectRatio.to_freepik_format(aspect_ratio)
            
            # Step 3: Convert image URL to base64 (Freepik requires base64)
            from core.image_input_handler import ImageInputHandler
            image_base64 = ImageInputHandler.url_to_base64(image_url)
            
            # Step 4: Call Freepik Reimagine API
            result = freepik_client.reimagine_flux(
                image=image_base64,
                prompt=refined_prompt,
                imagination=imagination,
                aspect_ratio=freepik_aspect_ratio,
                webhook_url=webhook_url
            )
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            logger.info(f"Reimagine task created: {data.get('task_id')}")
            
            # Upload if completed
            if data.get('status') == 'COMPLETED' and data.get('reimagined'):
                uploaded_urls = self._upload_reimagined_images(data['reimagined'])
                data['uploaded_urls'] = uploaded_urls
                
                # Save to gallery
                self._save_to_gallery(
                    user_id=user_id,
                    uploaded_urls=uploaded_urls,
                    refined_prompt=refined_prompt,
                    intent='reimagine',
                    metadata={
                        'original_image': image_url,
                        'original_prompt': prompt,
                        'imagination': imagination,
                        'aspect_ratio': aspect_ratio
                    }
                )
            
            return {
                'task_id': data.get('task_id'),
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', []),
                'original_image': image_url,
                'original_prompt': prompt,
                'refined_prompt': refined_prompt,
                'imagination': imagination,
                'aspect_ratio': aspect_ratio
            }
        
        except Exception as e:
            logger.error(f"Reimagination failed: {str(e)}")
            raise ReimagineError(f"Reimagine failed: {str(e)}")
    
    def poll_task_status(self, task_id: str) -> Dict:
        """Poll reimagine task status"""
        try:
            result = freepik_client.get_task_status(task_id, endpoint='reimagine-flux')
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            
            if data.get('status') == 'COMPLETED' and data.get('reimagined'):
                if not data.get('uploaded_urls'):  # Only upload if empty
                    logger.info(f"Uploading {len(data['reimagined'])} reimagined images...")
                    uploaded_urls = self._upload_reimagined_images(data['reimagined'])
                    data['uploaded_urls'] = uploaded_urls
                    logger.info(f"✓ Uploaded {len(uploaded_urls)} images successfully")
            
            return data
        
        except Exception as e:
            logger.error(f"Failed to poll reimagine status: {str(e)}")
            raise ReimagineError(f"Status check failed: {str(e)}")
    
    def _upload_reimagined_images(self, image_urls: list) -> list:
        """Upload reimagined images to file service"""
        uploaded_urls = []
        
        for url in image_urls:
            try:
                uploaded_url = file_uploader.upload_from_url(url)
                uploaded_urls.append(uploaded_url)
                logger.info(f"Uploaded reimagined image: {uploaded_url}")
            except FileUploadError as e:
                logger.error(f"Failed to upload reimagined image: {str(e)}")
        
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
