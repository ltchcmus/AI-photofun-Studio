# Configuration settings for the API Gateway

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "API Gateway")
    API_VERSION: str = os.getenv("API_VERSION", "v1")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 9999))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "t")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

settings = Settings()