# Configuration settings for the API Gateway

import os

class Config:
    PORT = int(os.getenv("API_GATEWAY_PORT", 9999))
    DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    
    # Add other configuration settings as needed
    # For example:
    # DATABASE_URL = os.getenv("DATABASE_URL")
    # SECRET_KEY = os.getenv("SECRET_KEY")