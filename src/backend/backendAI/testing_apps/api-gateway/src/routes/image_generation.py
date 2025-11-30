from fastapi import APIRouter

router = APIRouter()

@router.post("/generate-image")
async def generate_image(data: dict):
    return {"message": "Image generation is not yet implemented."}

@router.get("/image-status/{image_id}")
async def get_image_status(image_id: str):
    return {"message": "Image status retrieval is not yet implemented."}

@router.delete("/delete-image/{image_id}")
async def delete_image(image_id: str):
    return {"message": "Image deletion is not yet implemented."}