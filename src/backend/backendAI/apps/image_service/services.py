import base64
from typing import Dict, Any
from uuid import uuid4
from core import ResponseFormatter
import logging

logger = logging.getLogger(__name__)


def mock_generate_base64(refined_prompt: dict, size: str = "1024x1024") -> Dict[str, Any]:
    """
    Mock image generation service
    Used for testing and development
    
    Args:
        refined_prompt: Prompt result dict with keys: prompt, intent, metadata
        size: Image size (ignored in mock)
        
    Returns:
        ResponseFormatter dict with mock image_url
    """
    logger.info(f"[MockImageService] Mock generation for prompt: {refined_prompt.get('prompt', '')[:100]}")
    
    # Mock static image URL
    image_url = "https://res.cloudinary.com/derwtva4p/image/upload/v1764681978/file-service/f83e23e7-a56e-4e53-973e-99d23a232526.jpg"
    
    result = {
        "image_url": image_url,
        "metadata": {
            "processing_time": 0.1,
            "model": "mock-model",
            "size": size,
            "mock": True
        }
    }
    
    return ResponseFormatter.success(result=result)
