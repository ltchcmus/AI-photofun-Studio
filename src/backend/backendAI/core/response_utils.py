"""
Standard API response utilities
"""
from rest_framework.response import Response
from rest_framework import status


class APIResponse:
    """Standardized API response wrapper"""
    
    @staticmethod
    def success(data=None, message="Success", status_code=status.HTTP_200_OK):
        """
        Create success response
        
        Args:
            data: Response data
            message: Success message
            status_code: HTTP status code
            
        Returns:
            Response: DRF Response object
        """
        response_data = {
            'success': True,
            'message': message,
            'data': data
        }
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error(message="Error", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        """
        Create error response
        
        Args:
            message: Error message
            errors: Detailed error information
            status_code: HTTP status code
            
        Returns:
            Response: DRF Response object
        """
        response_data = {
            'success': False,
            'message': message,
        }
        
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def not_found(message="Resource not found"):
        """Create not found response"""
        return APIResponse.error(message, status_code=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def unauthorized(message="Unauthorized"):
        """Create unauthorized response"""
        return APIResponse.error(message, status_code=status.HTTP_401_UNAUTHORIZED)
    
    @staticmethod
    def forbidden(message="Forbidden"):
        """Create forbidden response"""
        return APIResponse.error(message, status_code=status.HTTP_403_FORBIDDEN)
    
    @staticmethod
    def server_error(message="Internal server error"):
        """Create server error response"""
        return APIResponse.error(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
