"""
Custom exception handlers
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Custom exception handler for DRF"""
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response = {
            'success': False,
            'message': 'An error occurred',
            'errors': response.data
        }
        response.data = custom_response
    else:
        # Handle non-DRF exceptions
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        custom_response = {
            'success': False,
            'message': 'Internal server error',
            'errors': str(exc)
        }
        response = Response(custom_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response
