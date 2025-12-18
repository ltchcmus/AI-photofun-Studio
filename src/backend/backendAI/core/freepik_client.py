"""
Freepik API Client - Wrapper for all Freepik AI endpoints

API Key: FPSX66c28e0d80af9f0e2e80d89ee01e834c
Base URL: https://api.freepik.com
"""

import requests
import base64
import logging
import time
from typing import Dict, Any, Optional, List
from django.conf import settings

logger = logging.getLogger(__name__)


class FreepikAPIError(Exception):
    """Custom exception for Freepik API errors"""
    pass


class FreepikClient:
    """
    HTTP client for Freepik API
    
    Usage:
        from core.freepik_client import freepik_client
        
        result = freepik_client.generate_image_mystic(
            prompt="A sunset over mountains",
            aspect_ratio="square_1_1"
        )
    """
    
    BASE_URL = "https://api.freepik.com"
    
    def __init__(self):
        self.api_key = getattr(settings, 'FREEPIK_API_KEY', 'FPSX3d8830ff41ace804badb3f71265b89bd')
        self.timeout = getattr(settings, 'FREEPIK_TIMEOUT', 60)  # Longer timeout for AI operations
        
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with API key"""
        return {
            'x-freepik-api-key': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, method: str, endpoint: str, max_retries: int = 3, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request to Freepik API with retry mechanism
        
        Args:
            method: HTTP method
            endpoint: API endpoint (without base URL)
            max_retries: Maximum number of retry attempts
            **kwargs: Additional request parameters
            
        Returns:
            Response JSON
            
        Raises:
            FreepikAPIError: When request fails after all retries
        """
        url = f"{self.BASE_URL}{endpoint}"
        headers = self._get_headers()
        
        # Merge custom headers if provided
        if 'headers' in kwargs:
            headers.update(kwargs.pop('headers'))
        
        last_error = None
        for attempt in range(max_retries):
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    headers=headers,
                    timeout=self.timeout,
                    **kwargs
                )
                response.raise_for_status()
                result = response.json()
                
                # Log response for debugging
                logger.info(f"Freepik API response: {result}")
                
                return result
                
            except requests.exceptions.Timeout:
                last_error = "Freepik API request timeout"
                logger.warning(f"Freepik API timeout (attempt {attempt + 1}/{max_retries}): {url}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
                logger.error(f"Freepik API timeout after {max_retries} attempts: {url}")
                
            except requests.exceptions.HTTPError as e:
                status_code = e.response.status_code
                
                # Don't retry on client errors (4xx)
                if 400 <= status_code < 500:
                    logger.error(f"Freepik API client error {status_code}: {e.response.text[:500]}")
                    raise FreepikAPIError(f"Freepik API error {status_code}: Invalid request")
                
                # Retry on server errors (5xx)
                last_error = f"Freepik API server error {status_code}"
                logger.warning(f"Freepik API server error {status_code} (attempt {attempt + 1}/{max_retries})")
                
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
                    continue
                    
                logger.error(f"Freepik API error {status_code} after {max_retries} attempts: {e.response.text[:200]}")
                
            except requests.exceptions.RequestException as e:
                last_error = f"Freepik API unavailable: {str(e)}"
                logger.warning(f"Freepik API request failed (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                logger.error(f"Freepik API request failed after {max_retries} attempts: {str(e)}")
        
        # All retries exhausted
        raise FreepikAPIError(f"{last_error} (after {max_retries} retries)")
    
    def _encode_image_to_base64(self, image_path_or_url: str) -> str:
        """
        Encode image to base64
        
        Args:
            image_path_or_url: Local file path or URL
            
        Returns:
            Base64 encoded string
        """
        if image_path_or_url.startswith('http'):
            # Download image from URL
            response = requests.get(image_path_or_url, timeout=10)
            response.raise_for_status()
            return base64.b64encode(response.content).decode('utf-8')
        else:
            # Read local file
            with open(image_path_or_url, 'rb') as f:
                return base64.b64encode(f.read()).decode('utf-8')
    
    # =========================================================================
    # IMAGE GENERATION - MYSTIC
    # =========================================================================
    
    def generate_image_mystic(
        self,
        prompt: str,
        webhook_url: Optional[str] = None,
        structure_reference: Optional[str] = None,
        structure_strength: int = 50,
        style_reference: Optional[str] = None,
        adherence: int = 50,
        hdr: int = 50,
        resolution: str = "2k",
        aspect_ratio: str = "square_1_1",
        model: str = "realism",
        creative_detailing: int = 33,
        engine: str = "automatic",
        fixed_generation: bool = False,
        filter_nsfw: bool = True,
        styling: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate image using Mystic AI model
        
        POST /v1/ai/mystic
        
        Args:
            prompt: Text description of image to generate
            webhook_url: Optional callback URL for async notifications
            structure_reference: Base64 image for structure reference
            structure_strength: Structure influence (0-100)
            style_reference: Base64 image for style reference
            adherence: Prompt adherence vs style transfer (0-100)
            hdr: Detail level (0-100)
            resolution: "1k", "2k", "4k"
            aspect_ratio: e.g., "square_1_1", "widescreen_16_9"
            model: "realism", "fluid", "zen", "flexible", "super_real", "editorial_portraits"
            creative_detailing: Detail per pixel (0-100)
            engine: "automatic", "magnific_illusio", "magnific_sharpy", "magnific_sparkle"
            fixed_generation: Same settings = same image
            filter_nsfw: Filter NSFW content (always True for standard API)
            styling: Optional styling dict with characters/styles
            
        Returns:
            {
                "task_id": "uuid",
                "status": "CREATED",
                "generated": ["url1", "url2"]
            }
        """
        payload = {
            "prompt": prompt,
            "resolution": resolution,
            "aspect_ratio": aspect_ratio,
            "model": model,
            "creative_detailing": creative_detailing,
            "engine": engine,
            "fixed_generation": fixed_generation,
            "filter_nsfw": filter_nsfw
        }
        
        if webhook_url:
            payload["webhook_url"] = webhook_url
        
        if structure_reference:
            payload["structure_reference"] = structure_reference
            payload["structure_strength"] = structure_strength
        
        if style_reference:
            payload["style_reference"] = style_reference
            payload["adherence"] = adherence
            payload["hdr"] = hdr
        
        if styling:
            payload["styling"] = styling
        
        return self._make_request('POST', '/v1/ai/mystic', json=payload)
    
    # =========================================================================
    # IMAGE UPSCALER - PRECISION V1
    # =========================================================================
    
    def upscale_image(
        self,
        image: str,  # Base64 encoded
        webhook_url: Optional[str] = None,
        sharpen: int = 50,
        smart_grain: int = 7,
        ultra_detail: int = 30
    ) -> Dict[str, Any]:
        """
        Upscale image with precision
        
        POST /v1/ai/image-upscaler-precision
        
        Args:
            image: Base64 encoded image
            webhook_url: Optional callback URL
            sharpen: Sharpen level (0-100)
            smart_grain: Smart grain (0-100)
            ultra_detail: Ultra detail (0-100)
            
        Returns:
            {
                "data": {
                    "task_id": "uuid",
                    "status": "CREATED",
                    "generated": ["url"]
                }
            }
        """
        payload = {
            "image": image,
            "sharpen": sharpen,
            "smart_grain": smart_grain,
            "ultra_detail": ultra_detail
        }
        
        if webhook_url:
            payload["webhook_url"] = webhook_url
        
        return self._make_request('POST', '/v1/ai/image-upscaler-precision', json=payload)
    
    # =========================================================================
    # REMOVE BACKGROUND
    # =========================================================================
    
    def remove_background(self, image_url: str) -> Dict[str, Any]:
        """
        Remove background from image
        
        POST /v1/ai/beta/remove-background
        
        Args:
            image_url: URL of image to process
            
        Returns:
            {
                "original": "url",
                "high_resolution": "url",
                "preview": "url",
                "url": "url"
            }
        """
        # This endpoint uses form-data, not JSON
        headers = {'x-freepik-api-key': self.api_key}
        data = {'image_url': image_url}
        
        url = f"{self.BASE_URL}/v1/ai/beta/remove-background"
        response = requests.post(url, headers=headers, data=data, timeout=self.timeout)
        response.raise_for_status()
        return response.json()
    
    # =========================================================================
    # IMAGE RELIGHT
    # =========================================================================
    
    def relight_image(
        self,
        image: str,  # Base64 or URL
        webhook_url: Optional[str] = None,
        prompt: Optional[str] = None,
        transfer_light_from_reference_image: Optional[str] = None,
        transfer_light_from_lightmap: Optional[str] = None,
        light_transfer_strength: int = 100,
        interpolate_from_original: bool = False,
        change_background: bool = True,
        style: str = "standard",
        preserve_details: bool = True,
        advanced_settings: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Relight an image using AI
        
        POST /v1/ai/image-relight
        
        Args:
            image: Base64 or URL of image
            webhook_url: Optional callback URL
            prompt: Guide lighting with description
            transfer_light_from_reference_image: Base64 or URL reference
            transfer_light_from_lightmap: Base64 or URL lightmap
            light_transfer_strength: Intensity (0-100)
            interpolate_from_original: Interpolate from original
            change_background: Change background based on prompt
            style: "standard", "darker_but_realistic", "clean", etc.
            preserve_details: Maintain texture and details
            advanced_settings: Optional advanced settings dict
            
        Returns:
            {
                "data": {
                    "task_id": "uuid",
                    "status": "CREATED",
                    "generated": ["url"]
                }
            }
        """
        payload = {
            "image": image,
            "light_transfer_strength": light_transfer_strength,
            "interpolate_from_original": interpolate_from_original,
            "change_background": change_background,
            "style": style,
            "preserve_details": preserve_details
        }
        
        if webhook_url:
            payload["webhook_url"] = webhook_url
        if prompt:
            payload["prompt"] = prompt
        if transfer_light_from_reference_image:
            payload["transfer_light_from_reference_image"] = transfer_light_from_reference_image
        if transfer_light_from_lightmap:
            payload["transfer_light_from_lightmap"] = transfer_light_from_lightmap
        if advanced_settings:
            payload["advanced_settings"] = advanced_settings
        
        return self._make_request('POST', '/v1/ai/image-relight', json=payload)
    
    # =========================================================================
    # STYLE TRANSFER
    # =========================================================================
    
    def transfer_style(
        self,
        image: str,  # Base64 or URL
        reference_image: str,  # Base64 or URL
        webhook_url: Optional[str] = None,
        prompt: Optional[str] = None,
        style_strength: int = 100,
        structure_strength: int = 50,
        is_portrait: bool = False,
        portrait_style: str = "standard",
        portrait_beautifier: Optional[str] = None,
        flavor: str = "faithful",
        engine: str = "balanced",
        fixed_generation: bool = False
    ) -> Dict[str, Any]:
        """
        Transfer style from reference image
        
        POST /v1/ai/image-style-transfer
        
        Args:
            image: Base64 or URL of image
            reference_image: Base64 or URL of reference
            webhook_url: Optional callback URL
            prompt: Optional prompt for AI model
            style_strength: Style intensity (0-100)
            structure_strength: Structure preservation (0-100)
            is_portrait: Process as portrait
            portrait_style: "standard", "pop", "super_pop"
            portrait_beautifier: "beautify_face", "beautify_face_max"
            flavor: "faithful", "gen_z", "psychedelia", etc.
            engine: "balanced", "definio", "illusio", etc.
            fixed_generation: Same settings = same image
            
        Returns:
            {
                "task_id": "uuid",
                "task_status": "IN_PROGRESS",
                "generated": ["url"]
            }
        """
        payload = {
            "image": image,
            "reference_image": reference_image,
            "style_strength": style_strength,
            "structure_strength": structure_strength,
            "is_portrait": is_portrait,
            "portrait_style": portrait_style,
            "flavor": flavor,
            "engine": engine,
            "fixed_generation": fixed_generation
        }
        
        if webhook_url:
            payload["webhook_url"] = webhook_url
        if prompt:
            payload["prompt"] = prompt
        if portrait_beautifier:
            payload["portrait_beautifier"] = portrait_beautifier
        
        return self._make_request('POST', '/v1/ai/image-style-transfer', json=payload)
    
    # =========================================================================
    # REIMAGINE FLUX
    # =========================================================================
    
    def reimagine_flux(
        self,
        image: str,  # Base64
        prompt: Optional[str] = None,
        webhook_url: Optional[str] = None,
        imagination: Optional[str] = None,  # "wild", "subtle", "vivid"
        aspect_ratio: str = "original"
    ) -> Dict[str, Any]:
        """
        Reimagine image using Flux model
        
        POST /v1/ai/beta/text-to-image/reimagine-flux
        
        Args:
            image: Base64 encoded image
            prompt: Optional description
            webhook_url: Optional callback URL
            imagination: "wild", "subtle", "vivid"
            aspect_ratio: "original", "square_1_1", etc.
            
        Returns:
            {
                "task_id": "uuid",
                "status": "CREATED",
                "generated": ["url"]
            }
        """
        payload = {
            "image": image,
            "aspect_ratio": aspect_ratio
        }
        
        if prompt:
            payload["prompt"] = prompt
        if webhook_url:
            payload["webhook_url"] = webhook_url
        if imagination:
            payload["imagination"] = imagination
        
        return self._make_request('POST', '/v1/ai/beta/text-to-image/reimagine-flux', json=payload)
    
    # =========================================================================
    # IMAGE EXPAND
    # =========================================================================
    
    def expand_image(
        self,
        image: str,  # Base64
        webhook_url: Optional[str] = None,
        prompt: Optional[str] = None,
        left: Optional[int] = None,
        right: Optional[int] = None,
        top: Optional[int] = None,
        bottom: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Expand image using AI Flux Pro
        
        POST /v1/ai/image-expand/flux-pro
        
        Args:
            image: Base64 encoded image
            webhook_url: Optional callback URL
            prompt: Description of changes
            left: Pixels to expand left (0-2048)
            right: Pixels to expand right (0-2048)
            top: Pixels to expand top (0-2048)
            bottom: Pixels to expand bottom (0-2048)
            
        Returns:
            {
                "data": {
                    "task_id": "uuid",
                    "status": "CREATED",
                    "generated": ["url"]
                }
            }
        """
        payload = {"image": image}
        
        if webhook_url:
            payload["webhook_url"] = webhook_url
        if prompt:
            payload["prompt"] = prompt
        if left is not None:
            payload["left"] = left
        if right is not None:
            payload["right"] = right
        if top is not None:
            payload["top"] = top
        if bottom is not None:
            payload["bottom"] = bottom
        
        return self._make_request('POST', '/v1/ai/image-expand/flux-pro', json=payload)
    
    # =========================================================================
    # TASK STATUS POLLING
    # =========================================================================
    
    def get_task_status(self, task_id: str, endpoint: str = "mystic") -> Dict[str, Any]:
        """
        Get status of async task
        
        GET /v1/ai/{endpoint}/{task_id}
        
        Args:
            task_id: Task UUID
            endpoint: API endpoint short name (e.g., "mystic", "upscaler-precision")
                     or full path (e.g., "/v1/ai/mystic")
            
        Returns:
            Task status with generated URLs if completed
        """
        # Handle both short names and full paths
        if not endpoint.startswith('/'):
            endpoint = f"/v1/ai/{endpoint}"
        
        url = f"{endpoint}/{task_id}"
        return self._make_request('GET', url)


# Singleton instance
freepik_client = FreepikClient()
