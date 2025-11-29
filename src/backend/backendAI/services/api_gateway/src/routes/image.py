from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.image_service import generate_image

router = APIRouter()

class ImageRequest(BaseModel):
    prompt: str
    style: str

class ImageResponse(BaseModel):
    image_url: str

@router.post("/generate-image", response_model=ImageResponse)
async def create_image(request: ImageRequest):
    try:
        image_url = await generate_image(request.prompt, request.style)
        return ImageResponse(image_url=image_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))