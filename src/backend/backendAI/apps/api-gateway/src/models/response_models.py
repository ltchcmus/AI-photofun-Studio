from pydantic import BaseModel
from typing import List, Optional

class ChatResponse(BaseModel):
    session_id: str
    messages: List[str]
    status: str
    error: Optional[str] = None

class ImageGenerationResponse(BaseModel):
    image_url: str
    status: str
    error: Optional[str] = None

class HealthCheckResponse(BaseModel):
    status: str
    message: str

class ErrorResponse(BaseModel):
    status: str
    error: str
    message: Optional[str] = None