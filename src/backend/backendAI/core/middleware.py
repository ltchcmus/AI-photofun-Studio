"""
Custom middleware for the backend AI application
"""
import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(MiddlewareMixin):
    """Middleware to log all requests"""
    
    def process_request(self, request):
        request._start_time = time.time()
        logger.info(f"Request: {request.method} {request.path}")
        return None
    
    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            logger.info(
                f"Response: {request.method} {request.path} "
                f"Status: {response.status_code} Duration: {duration:.2f}s"
            )
        return response


class CORSMiddleware(MiddlewareMixin):
    """Custom CORS middleware (if not using django-cors-headers)"""
    
    def process_response(self, request, response):
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
