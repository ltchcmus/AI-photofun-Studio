import base64
from typing import Dict, Any
from uuid import uuid4
from core import ResponseFormatter


def mock_generate_base64(refined_prompt: str, size: str = "1024x1024") -> Dict[str, Any]:
    """Takes the prompt refinement result and returns a dict with image_url (uploaded) and metadata.
    Expected prompt_result: { refined_prompt: str, intent: str, ... }
    """
    print("Mock generating start: ", refined_prompt)
    prompt = refined_prompt.get("prompt") or ""
    intent = refined_prompt.get("intent") or ""

    image_url = "https://res.cloudinary.com/derwtva4p/image/upload/v1764681978/file-service/f83e23e7-a56e-4e53-973e-99d23a232526.jpg"
    result = {
        "image_url": image_url,
        "metadata": {
            "processing_time": 10,
            "model": "model-name",
            "size": "1024x1024",
            "seed": ""
        }
    }
    print("Mock generating end: ", refined_prompt)
    return ResponseFormatter.success(result=result)
