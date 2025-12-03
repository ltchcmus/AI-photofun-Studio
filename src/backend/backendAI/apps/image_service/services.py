import base64
import time
from typing import Dict, Any
from uuid import uuid4
from core import APIResponse


def mock_generate_base64(refined_prompt: str, size: str = "1024x1024") -> Dict[str, Any]:
    """Takes the prompt refinement result and returns a dict with image_url (uploaded) and metadata.
    Expected prompt_result: { refined_prompt: str, intent: str, ... }
    """
    refined_prompt = (prompt_result or {}).get("refined_prompt")
    intent = (prompt_result or {}).get("intent")
    out = mock_generate_base64(refined_prompt or "", size)

    image_url = None
    media_upload_url = os.getenv("MEDIA_UPLOAD_URL")
    if media_upload_url:
        try:
            image_id = str(uuid4())
            data = {
                "id": image_id
            }
            raw = base64.b64decode(out["image_base64"]) if out.get("image_base64") else b""
            files = {"file": ("generated.png", raw, "image/png")}
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(media_upload_url, data=data, files=files)
                resp.raise_for_status()
                data = resp.json()
                image_url = data.get("file_url") or data.get("image_url")
        except Exception:
            image_url = None

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
    return APIResponse.success(result=result)
