from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter()

class ImageRequest(BaseModel):
    image_data: str
    processing_type: str

class ImageResponse(BaseModel):
    success: bool
    message: str
    image_url: str = None

@router.post("/generate-image", response_model=ImageResponse)
async def generate_image(request: ImageRequest):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post("http://backendAI:8000/image/generate", json=request.dict())
            response_data = response.json()

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response_data.get("message", "Error generating image"))

            return ImageResponse(success=True, message="Image generated successfully", image_url=response_data.get("image_url"))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))