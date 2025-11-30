from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Initialize the FastAPI application
app = FastAPI()

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed for your application
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-gateway")

@app.get("/")
async def root():
    return {"message": "Welcome to the API Gateway"}

# Include routes
from routes import chat, image, health

app.include_router(chat.router)
app.include_router(image.router)
app.include_router(health.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9999)