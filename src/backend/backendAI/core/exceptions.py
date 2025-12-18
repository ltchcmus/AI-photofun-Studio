"""
Custom exception handlers
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from .constants import ResponseCode
import logging

logger = logging.getLogger(__name__)


# Custom Exceptions
class TokenServiceError(Exception):
    """Raised when token service API fails"""
    pass


class InsufficientTokensError(Exception):
    """Raised when user doesn't have enough tokens"""
    pass


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF.
    Returns standardized response format: {"code": ..., "message": ..., "result": ...}
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        # Map HTTP status code to response code
        status_code = response.status_code
        if status_code == 404:
            code = ResponseCode.NOT_FOUND
            message = "Resource not found"
        elif status_code == 401:
            code = ResponseCode.UNAUTHORIZED
            message = "Unauthorized"
        elif status_code == 403:
            code = ResponseCode.FORBIDDEN
            message = "Forbidden"
        elif status_code >= 500:
            code = ResponseCode.SERVER_ERROR
            message = "Internal server error"
        else:
            code = ResponseCode.ERROR
            message = "An error occurred"
        
        # Standardized response format
        custom_response = {
            'code': code,
            'message': message,
            'result': response.data if isinstance(response.data, dict) else {'detail': str(response.data)}
        }
        response.data = custom_response
    else:
        # Handle non-DRF exceptions
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        custom_response = {
            'code': ResponseCode.SERVER_ERROR,
            'message': 'Internal server error',
            'result': {'detail': str(exc)}
        }
        response = Response(custom_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response
