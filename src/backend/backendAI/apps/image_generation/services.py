"""
Image Generation Service
Business logic for text-to-image generation using Freepik Mystic API
"""

import logging
from typing import Dict, Optional, Any
from core.freepik_client import freepik_client
from core.file_uploader import file_uploader, FileUploadError
from core.exceptions import TokenServiceError
from apps.prompt_service.services import PromptService
from apps.image_gallery.services import image_gallery_service
from apps.intent_router.constants import AspectRatio

logger = logging.getLogger(__name__)


class ImageGenerationError(Exception):
    """Custom exception for image generation errors"""
    pass


class ImageGenerationService:
    """Handle image generation workflow"""
    
    def __init__(self):
        self.prompt_service = PromptService()
    
    def generate_image(
        self,
        prompt: str,
        user_id: str,
        aspect_ratio: str = "square_1_1",
        style_reference: Optional[str] = None,
        structure_reference: Optional[str] = None,
        model: str = "realism",
        resolution: str = "2k",
        adherence: float = 0.8,
        hdr: bool = False,
        creative_detailing: Optional[str] = None,
        engine: Optional[str] = None,
        fixed_generation: bool = False,
        filter_nsfw: bool = True,
        styling: Optional[Dict[str, Any]] = None,
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate image from prompt
        
        Args:
            prompt: Text description
            user_id: User identifier
            aspect_ratio: Image aspect ratio (square_1_1, portrait_9_16, etc.)
            style_reference: URL of style reference image
            structure_reference: URL of structure reference image
            model: AI model (realism, fluid, zen, flexible, etc.)
            resolution: Output resolution (2k, 4k)
            adherence: Reference adherence (0.0-1.0)
            hdr: Enable HDR
            creative_detailing: Enhanced detail level
            engine: Specific engine override
            fixed_generation: Disable random seed
            filter_nsfw: Filter NSFW content
            styling: Additional styling parameters
            webhook_url: Webhook for async notifications
            
        Returns:
            {
                "task_id": "uuid",
                "status": "CREATED",
                "generated": ["url1", "url2"]  # if complete
            }
            
        Raises:
            ImageGenerationError: When generation fails
        """
        try:
            # Use prompt as-is (already refined by prompt_service task in chain)
            logger.info(f"Generating image with prompt: {prompt[:80]}...")
            
            # Convert aspect ratio to Freepik format if needed
            freepik_aspect_ratio = AspectRatio.to_freepik_format(aspect_ratio)
            
            # Call Freepik Mystic API
            logger.info(f"Calling Freepik Mystic API with model={model}, aspect_ratio={freepik_aspect_ratio}")
            result = freepik_client.generate_image_mystic(
                prompt=prompt,  # Already refined by prompt_service task
                aspect_ratio=freepik_aspect_ratio,
                model=model,
                resolution=resolution,
                style_reference=style_reference,
                structure_reference=structure_reference,
                adherence=adherence,
                hdr=hdr,
                creative_detailing=creative_detailing,
                engine=engine,
                fixed_generation=fixed_generation,
                filter_nsfw=filter_nsfw,
                styling=styling,
                webhook_url=webhook_url
            )
            
            # Extract data from Freepik response
            data = result.get('data', result)  # Handle both {'data': {...}} and direct {...}
            
            logger.info(f"Image generation task created: {data.get('task_id')}")
            
            # Step 3: Return task info for polling
            # If already completed (sync), download and upload to file service
            if data.get('status') == 'COMPLETED' and data.get('generated'):
                logger.info("Image generation completed synchronously")
                uploaded_urls = self._upload_generated_images(data['generated'])
                data['uploaded_urls'] = uploaded_urls
                
                # Save to image gallery
                self._save_to_gallery(
                    user_id=user_id,
                    uploaded_urls=uploaded_urls,
                    refined_prompt=refined_prompt,
                    intent='image_generate',
                    metadata={
                        'model': model,
                        'aspect_ratio': aspect_ratio,
                        'resolution': resolution,
                        'original_prompt': prompt
                    }
                )
            
            return {
                'task_id': data.get('task_id'),
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', []),
                'original_prompt': prompt,
                'refined_prompt': prompt,  # Already refined by prompt_service task
                'model': model,
                'aspect_ratio': aspect_ratio
            }
        
        except TokenServiceError as e:
            logger.error(f"Token service error: {str(e)}")
            raise ImageGenerationError(f"Token error: {str(e)}")
        
        except Exception as e:
            logger.error(f"Image generation failed: {str(e)}")
            raise ImageGenerationError(f"Generation failed: {str(e)}")
    
    def poll_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        Poll task status from Freepik API
        
        Args:
            task_id: Task UUID
            
        Returns:
            {
                "task_id": "uuid",
                "status": "COMPLETED",
                "generated": ["url1", "url2"],
                "uploaded_urls": ["storage_url1", "storage_url2"]
            }
            
        Raises:
            ImageGenerationError: When polling fails
        """
        try:
            result = freepik_client.get_task_status(task_id, endpoint='mystic')
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            
            # If completed, upload to file service
            if data.get('status') == 'COMPLETED' and data.get('generated'):
                # Only upload if not already uploaded (check if empty or missing)
                if not data.get('uploaded_urls'):
                    logger.info(f"Uploading {len(data['generated'])} generated images...")
                    uploaded_urls = self._upload_generated_images(data['generated'])
                    data['uploaded_urls'] = uploaded_urls
                    logger.info(f"✓ Uploaded {len(uploaded_urls)} images successfully")
            
            return data
        
        except Exception as e:
            logger.error(f"Failed to poll task status: {str(e)}")
            raise ImageGenerationError(f"Status check failed: {str(e)}")
    
    def _upload_generated_images(self, image_urls: list) -> list:
        """
        Upload generated images to file service
        
        Args:
            image_urls: List of Freepik result URLs
            
        Returns:
            List of uploaded URLs
        """
        uploaded_urls = []
        
        for url in image_urls:
            try:
                uploaded_url = file_uploader.upload_from_url(url)
                uploaded_urls.append(uploaded_url)
                logger.info(f"Uploaded generated image: {uploaded_url}")
            except FileUploadError as e:
                logger.error(f"Failed to upload image {url}: {str(e)}")
                # Continue with other images
        
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
