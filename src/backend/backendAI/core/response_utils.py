# core/response_utils.py
from rest_framework.response import Response
from rest_framework import status
from .constants import ResponseCode

class APIResponse:
    """Standardized API response wrapper"""

    @staticmethod
    def success(result=None, message="Success", code=ResponseCode.SUCCESS, status_code=status.HTTP_200_OK):
        response_data = {
            'code': code,
            'message': message,
            'result': result
        }
        return Response(response_data, status=status_code)

    @staticmethod
    def error(message="Error", code=ResponseCode.ERROR, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        response_data = {
            'code': code,
            'message': message,
        }
        if errors:
            response_data['errors'] = errors
        return Response(response_data, status=status_code)

    @staticmethod
    def not_found(message="Resource not found", code=ResponseCode.NOT_FOUND):
        return APIResponse.error(message, code=code, status_code=status.HTTP_404_NOT_FOUND)

    @staticmethod
    def unauthorized(message="Unauthorized", code=ResponseCode.UNAUTHORIZED):
        return APIResponse.error(message, code=code, status_code=status.HTTP_401_UNAUTHORIZED)

    @staticmethod
    def forbidden(message="Forbidden", code=ResponseCode.FORBIDDEN):
        return APIResponse.error(message, code=code, status_code=status.HTTP_403_FORBIDDEN)

    @staticmethod
    def server_error(message="Internal server error", code=ResponseCode.SERVER_ERROR):
        return APIResponse.error(message, code=code, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
