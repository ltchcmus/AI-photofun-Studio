import logging
import os

# Configure the logger
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)

logger = logging.getLogger(__name__)

def log_request(request):
    logger.info(f"Request: {request.method} {request.url}")

def log_response(response):
    logger.info(f"Response: {response.status_code} {response.body}")

def log_error(error):
    logger.error(f"Error: {error}")