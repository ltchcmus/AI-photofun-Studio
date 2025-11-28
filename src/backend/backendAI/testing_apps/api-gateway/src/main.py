from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.conversation import router as conversation_router
# Import other route modules as needed

app = FastAPI()

# Load configuration settings
import config.settings as settings

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(conversation_router, prefix="/api/conversation", tags=["conversation"])
# Include other routers as needed

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)  # Ensure PORT is defined in settings.py