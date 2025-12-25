"""
Upscale Service
Business logic for image upscaling using Freepik Upscaler Precision API
"""

import logging
from typing import Dict, Optional
from django.core.cache import cache
from core.freepik_client import freepik_client
from core.file_uploader import file_uploader, FileUploadError
from apps.image_gallery.services import image_gallery_service
from shared.metadata_schema import MetadataBuilder

logger = logging.getLogger(__name__)


class UpscaleError(Exception):
    """Custom exception for upscale errors"""
    pass


class UpscaleService:
    """Handle image upscaling workflow"""
    
    def upscale_image(
        self,
        image_url: str,
        user_id: str,
        sharpen: float = 0.5,
        smart_grain: float = 0.0,
        ultra_detail: float = 0.0,
        flavor: str = 'photo',
        scale_factor: int = 2,
        webhook_url: Optional[str] = None
    ) -> Dict:
        """
        Upscale image with precision controls
        
        Args:
            image_url: URL of image to upscale
            user_id: User identifier
            sharpen: Sharpness level (0.0-1.0)
            smart_grain: Grain enhancement (0.0-1.0)
            ultra_detail: Ultra detail level (0.0-1.0)
            flavor: Upscale flavor (photo/sublime/photo_denoiser)
            scale_factor: Upscale factor (2-16)
            webhook_url: Webhook for async notifications
            
        Returns:
            {
                "task_id": "uuid",
                "status": "CREATED",
                "upscaled": ["url"]  # if complete
            }
            
        Raises:
            UpscaleError: When upscaling fails
        """
        try:
            # Step 1: Download image and encode to base64
            logger.info(f"Downloading image for upscaling: {image_url}")
            # The freepik_client will handle base64 encoding internally
            
            # Convert float (0.0-1.0) to integer (0-100) for Freepik API
            sharpen_int = int(sharpen * 100)
            smart_grain_int = int(smart_grain * 100)
            ultra_detail_int = int(ultra_detail * 100)
            
            # Step 2: Call Freepik Upscaler API V2
            logger.info(f"Calling Freepik Upscaler V2 with sharpen={sharpen_int}, smart_grain={smart_grain_int}, flavor={flavor}")
            result = freepik_client.upscale_image(
                image=image_url,  # Can pass URL or local path
                sharpen=sharpen_int,
                smart_grain=smart_grain_int,
                ultra_detail=ultra_detail_int,
                flavor=flavor,
                scale_factor=scale_factor,
                webhook_url=webhook_url
            )
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            logger.info(f"Upscale task created: {data.get('task_id')}")
            
            # Step 3: If completed, upload to file service
            if data.get('status') == 'COMPLETED' and data.get('upscaled'):
                logger.info("Upscale completed synchronously")
                uploaded_urls = self._upload_upscaled_images(data['upscaled'])
                data['uploaded_urls'] = uploaded_urls
                
                # Save to image gallery
                self._save_to_gallery(
                    user_id=user_id,
                    uploaded_urls=uploaded_urls,
                    refined_prompt=None,
                    intent='upscale',
                    metadata={
                        'original_image': image_url,
                        'sharpen': sharpen,
                        'smart_grain': smart_grain,
                        'ultra_detail': ultra_detail,
                        'flavor': flavor,
                        'scale_factor': scale_factor
                    }
                )
            
            return {
                'task_id': data.get('task_id'),
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', []),
                'original_image': image_url,
                'flavor': flavor,
                'scale_factor': scale_factor,
                'settings': {
                    'sharpen': sharpen,
                    'smart_grain': smart_grain,
                    'ultra_detail': ultra_detail
                }
            }
        
        except Exception as e:
            logger.error(f"Image upscaling failed: {str(e)}")
            raise UpscaleError(f"Upscale failed: {str(e)}")
    
    def poll_task_status(self, task_id: str, user_id: Optional[str] = None) -> Dict:
        """
        Poll upscale task status and save to gallery when completed
        
        Args:
            task_id: Task UUID
            user_id: User ID for gallery save (from query params)
            
        Returns:
            Task status with upscaled URLs
            
        Raises:
            UpscaleError: When polling fails
        """
        try:
            # CRITICAL: Freepik endpoint for upscale V2 is 'image-upscaler-precision-v2'
            result = freepik_client.get_task_status(task_id, endpoint='image-upscaler-precision-v2')
            
            # Extract data layer (Freepik returns nested structure)
            data = result.get('data', result)
            
            # DEBUG: Log all fields to understand Freepik response structure
            logger.info(f"[DEBUG] Freepik upscale response fields: {list(data.keys())}")
            logger.info(f"[DEBUG] Full response data: {data}")
            
            # If completed, upload to file service
            # Check multiple possible field names: generated, upscaled, result, images
            image_urls = data.get('generated') or data.get('upscaled') or data.get('result') or data.get('images') or []
            
            logger.info(f"[DEBUG] Extracted image_urls: {image_urls}")
            
            if data.get('status') == 'COMPLETED' and image_urls:
                if not data.get('uploaded_urls'):  # Only upload if empty
                    logger.info(f"Uploading {len(image_urls)} upscaled images...")
                    uploaded_urls = self._upload_upscaled_images(image_urls)
                    data['uploaded_urls'] = uploaded_urls
                    logger.info(f"✓ Uploaded {len(uploaded_urls)} images successfully")
                    
                    # Save to gallery if user_id provided and not already saved
                    cache_key = f'upscale_saved_{task_id}'
                    if user_id and not cache.get(cache_key):
                        # Retrieve task metadata from cache
                        task_metadata = cache.get(f'upscale_task_{task_id}', {})
                        
                        # Build standardized metadata
                        settings = task_metadata.get('settings', {})
                        metadata = MetadataBuilder.upscale(
                            task_id=task_id,
                            upscale_factor=2,
                            freepik_task_id=task_id,
                            original_image=task_metadata.get('original_image'),
                            settings=settings
                        )
                        
                        # Save to gallery
                        self._save_to_gallery(
                            user_id=user_id,
                            uploaded_urls=uploaded_urls,
                            refined_prompt=None,
                            intent='upscale',
                            metadata=metadata
                        )
                        
                        # Mark as saved to prevent duplicate saves
                        cache.set(cache_key, True, timeout=3600)
                        logger.info(f"Saved {len(uploaded_urls)} upscaled images to gallery")
            
            return {
                'task_id': task_id,
                'status': data.get('status'),
                'uploaded_urls': data.get('uploaded_urls', [])
            }
        
        except Exception as e:
            logger.error(f"Failed to poll upscale status: {str(e)}")
            raise UpscaleError(f"Status check failed: {str(e)}")
    
    def _upload_upscaled_images(self, image_urls: list) -> list:
        """
        Upload upscaled images to file service
        
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
                logger.info(f"Uploaded upscaled image: {uploaded_url}")
            except FileUploadError as e:
                logger.error(f"Failed to upload upscaled image {url}: {str(e)}")
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
