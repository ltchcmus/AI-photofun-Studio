from starlette.middleware.base import BaseHTTPMiddleware
import logging
import time

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time

        logging.info(
            f"Request: {request.method} {request.url} - "
            f"Response: {response.status_code} - "
            f"Duration: {duration:.2f} seconds"
        )
        return response

# Initialize logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/gateway.log"),
        logging.StreamHandler()
    ]
)