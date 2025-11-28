from pydantic import BaseModel, validator
from typing import Any, Dict

class ChatRequestModel(BaseModel):
    user_id: str
    message: str

    @validator('user_id')
    def validate_user_id(cls, v):
        if not v:
            raise ValueError('User ID cannot be empty')
        return v

    @validator('message')
    def validate_message(cls, v):
        if not v:
            raise ValueError('Message cannot be empty')
        return v

class ImageRequestModel(BaseModel):
    image_data: str
    processing_type: str

    @validator('image_data')
    def validate_image_data(cls, v):
        if not v:
            raise ValueError('Image data cannot be empty')
        return v

    @validator('processing_type')
    def validate_processing_type(cls, v):
        allowed_types = ['background_removal', 'style_transfer', 'image_enhancement']
        if v not in allowed_types:
            raise ValueError(f'Processing type must be one of: {", ".join(allowed_types)}')
        return v

def validate_request(data: Dict[str, Any], request_type: str) -> None:
    if request_type == 'chat':
        ChatRequestModel(**data)
    elif request_type == 'image':
        ImageRequestModel(**data)
    else:
        raise ValueError('Invalid request type')