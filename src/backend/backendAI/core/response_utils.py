# core/response_utils.py
from rest_framework.response import Response
from rest_framework import status
from .constants import ResponseCode

class ResponseFormatter:
    """Standardized API response wrapper"""

    @staticmethod
    def success(result=None, message="Success", code=ResponseCode.SUCCESS, status_code=status.HTTP_200_OK):
        response_data = {
            'code': code,
            'message': message,
            'result': result
        }
        # return Response(response_data, status=status_code)
        return response_data

    @staticmethod
    def error(message="Error", code=ResponseCode.ERROR, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        print("API Error:", message)
        response_data = {
            'code': code,
            'message': message,
        }
        if errors:
            response_data['errors'] = errors
        # return Response(response_data, status=status_code)
        return response_data

    @staticmethod
    def not_found(message="Resource not found", code=ResponseCode.NOT_FOUND):
        return ResponseFormatter.error(message, code=code, status_code=status.HTTP_404_NOT_FOUND)

    @staticmethod
    def unauthorized(message="Unauthorized", code=ResponseCode.UNAUTHORIZED):
        return ResponseFormatter.error(message, code=code, status_code=status.HTTP_401_UNAUTHORIZED)

    @staticmethod
    def forbidden(message="Forbidden", code=ResponseCode.FORBIDDEN):
        return ResponseFormatter.error(message, code=code, status_code=status.HTTP_403_FORBIDDEN)

    @staticmethod
    def server_error(message="Internal server error", code=ResponseCode.SERVER_ERROR):
        return ResponseFormatter.error(message, code=code, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIResponse:
    """HTTP Response wrapper that uses ResponseFormatter payloads and DRF Response.
    Services should use ResponseFormatter (dict). Views should return APIResponse (Response).
    """

    @staticmethod
    def success(result=None, message="Success", code=ResponseCode.SUCCESS, status_code=status.HTTP_200_OK):
        data = ResponseFormatter.success(result=result, message=message, code=code, status_code=status_code)
        return Response(data, status=status_code)

    @staticmethod
    def error(message="Error", code=ResponseCode.ERROR, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        data = ResponseFormatter.error(message=message, code=code, errors=errors, status_code=status_code)
        return Response(data, status=status_code)

    @staticmethod
    def not_found(message="Resource not found", code=ResponseCode.NOT_FOUND):
        data = ResponseFormatter.error(message=message, code=code, status_code=status.HTTP_404_NOT_FOUND)
        return Response(data, status=status.HTTP_404_NOT_FOUND)

    @staticmethod
    def unauthorized(message="Unauthorized", code=ResponseCode.UNAUTHORIZED):
        data = ResponseFormatter.error(message=message, code=code, status_code=status.HTTP_401_UNAUTHORIZED)
        return Response(data, status=status.HTTP_401_UNAUTHORIZED)

    @staticmethod
    def forbidden(message="Forbidden", code=ResponseCode.FORBIDDEN):
        data = ResponseFormatter.error(message=message, code=code, status_code=status.HTTP_403_FORBIDDEN)
        return Response(data, status=status.HTTP_403_FORBIDDEN)

    @staticmethod
    def server_error(message="Internal server error", code=ResponseCode.SERVER_ERROR):
        data = ResponseFormatter.error(message=message, code=code, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
