from pydantic import BaseModel
from typing import Optional, List

class ChatRequestModel(BaseModel):
    user_id: str
    message: str
    session_id: Optional[str] = None

class ImageGenerationRequestModel(BaseModel):
    user_id: str
    prompt: str
    style: Optional[str] = None
    resolution: Optional[str] = "1024x1024"

class HealthCheckRequestModel(BaseModel):
    pass

class ImageProcessingRequestModel(BaseModel):
    user_id: str
    image_url: str
    operation: str
    parameters: Optional[dict] = None

class BulkImageGenerationRequestModel(BaseModel):
    user_id: str
    prompts: List[str]
    styles: Optional[List[str]] = None
    resolution: Optional[str] = "1024x1024"