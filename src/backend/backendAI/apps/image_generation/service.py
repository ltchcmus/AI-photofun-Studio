"""
Image Generation Service - Core Logic (NO DATABASE)

Pure stateless service - only processes requests and returns responses
"""
import io
import time
import logging
import uuid
from typing import Dict, List, Optional
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """Stateless service để generate images từ text prompts"""
    
    def __init__(self):
        self.model = None
        # TODO: Initialize Stable Diffusion when ready
        
        # Default generation parameters
        self.default_params = {
            'num_inference_steps': 50,
            'guidance_scale': 7.5,
            'width': 512,
            'height': 512,
            'num_images': 1,
        }
    
    def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        **kwargs
    ) -> Dict:
        """
        Generate image from text prompt
        
        Args:
            prompt: Text description
            negative_prompt: Things to avoid
            **kwargs: Additional parameters (width, height, steps, etc.)
            
        Returns:
            dict: {
                'success': bool,
                'request_id': str,
                'image_bytes': bytes,
                'metadata': dict
            }
        """
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        try:
            # Merge parameters
            params = {**self.default_params, **kwargs}
            
            # Validate parameters
            is_valid, error_msg = self.validate_parameters(params)
            if not is_valid:
                return {
                    'success': False,
                    'error': error_msg,
                    'request_id': request_id
                }
            
            logger.info(f"[{request_id}] Generating image: {prompt[:100]}...")
            
            # Generate image (placeholder for now)
            image_bytes, metadata = self._generate_placeholder(prompt, params)
            
            processing_time = time.time() - start_time
            
            logger.info(f"[{request_id}] Image generated in {processing_time:.2f}s")
            
            return {
                'success': True,
                'request_id': request_id,
                'image_bytes': image_bytes,
                'image_url': f'/api/temp/{request_id}.png',  # Temporary URL
                'metadata': {
                    **metadata,
                    'processing_time': processing_time,
                    'prompt': prompt,
                    'negative_prompt': negative_prompt,
                }
            }
            
        except Exception as e:
            logger.error(f"[{request_id}] Generation error: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'request_id': request_id
            }
    
    def generate_variations(
        self,
        prompt: str,
        num_variations: int = 4,
        **kwargs
    ) -> Dict:
        """Generate multiple variations of the same prompt"""
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        try:
            variations = []
            for i in range(num_variations):
                # Add variation seed
                var_params = {**kwargs, 'seed': kwargs.get('seed', 0) + i}
                result = self.generate_image(prompt, **var_params)
                
                if result['success']:
                    variations.append({
                        'variation_id': i + 1,
                        'image_bytes': result['image_bytes'],
                        'image_url': result['image_url'],
                    })
            
            processing_time = time.time() - start_time
            
            return {
                'success': True,
                'request_id': request_id,
                'variations': variations,
                'total_variations': len(variations),
                'processing_time': processing_time
            }
            
        except Exception as e:
            logger.error(f"[{request_id}] Variations error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'request_id': request_id
            }
    
    def validate_parameters(self, params: Dict) -> tuple[bool, str]:
        """Validate generation parameters"""
        # Width and height validation
        width = params.get('width', 512)
        height = params.get('height', 512)
        
        if not (128 <= width <= 2048):
            return False, "Width must be between 128 and 2048"
        
        if not (128 <= height <= 2048):
            return False, "Height must be between 128 and 2048"
        
        # Must be multiples of 64
        if width % 64 != 0 or height % 64 != 0:
            return False, "Width and height must be multiples of 64"
        
        # Inference steps validation
        steps = params.get('num_inference_steps', 50)
        if not (10 <= steps <= 150):
            return False, "Inference steps must be between 10 and 150"
        
        # Guidance scale validation
        guidance = params.get('guidance_scale', 7.5)
        if not (1.0 <= guidance <= 20.0):
            return False, "Guidance scale must be between 1.0 and 20.0"
        
        return True, ""
    
    def _generate_placeholder(self, prompt: str, params: Dict) -> tuple[bytes, Dict]:
        """Generate placeholder image (replace with Stable Diffusion later)"""
        width = params.get('width', 512)
        height = params.get('height', 512)
        
        # Create gradient image with prompt text
        img = Image.new('RGB', (width, height), color=(73, 109, 137))
        
        # Add some variation based on prompt
        pixels = np.array(img)
        noise = np.random.randint(0, 50, (height, width, 3))
        pixels = np.clip(pixels + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(pixels)
        
        # Convert to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()
        
        metadata = {
            'width': width,
            'height': width,
            'format': 'PNG',
            'size_bytes': len(img_bytes),
            'model': 'placeholder',
            'parameters': params
        }
        
        return img_bytes, metadata


# Singleton instance
_service_instance = None

def get_service() -> ImageGenerationService:
    """Get singleton service instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = ImageGenerationService()
    return _service_instance
