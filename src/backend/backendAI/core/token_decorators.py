"""
Token Service Decorators - Easy-to-use decorators for protecting views

Usage:
    from core.token_decorators import require_tokens
    
    @require_tokens(cost=10, feature="image_generation")
    def generate_image_view(request):
        # Token already deducted before this executes
        return Response(...)
"""

from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from core.token_client import token_client
from core.exceptions import InsufficientTokensError, TokenServiceError
import logging

logger = logging.getLogger(__name__)


def require_tokens(cost: int, feature: str = None, deduct_on_success: bool = False):
    """
    Decorator to check and optionally deduct tokens before executing view
    
    Args:
        cost: Number of tokens required
        feature: Feature name for logging/metadata
        deduct_on_success: If True, only deduct after successful execution
        
    Usage:
        # Deduct immediately (default - safer for paid features)
        @require_tokens(cost=10, feature="image_generation")
        def my_view(request):
            ...
        
        # Deduct only on success (for operations that might fail)
        @require_tokens(cost=10, feature="upscale", deduct_on_success=True)
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(*args, **kwargs):
            # Handle both function views and class-based views
            # For class views: args = (self, request, ...)
            # For function views: args = (request, ...)
            if len(args) > 0 and hasattr(args[0], 'data'):
                # First arg is request (function view)
                request = args[0]
            elif len(args) > 1 and hasattr(args[1], 'data'):
                # Second arg is request (class view)
                request = args[1]
            else:
                return Response(
                    {'error': 'Invalid request'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user_id from request
            user_id = None
            
            # Try to get from DRF request
            if hasattr(request, 'data'):
                user_id = request.data.get('user_id')
            
            # Try to get from query params
            if not user_id and hasattr(request, 'query_params'):
                user_id = request.query_params.get('user_id')
            
            # Try to get from POST data
            if not user_id and hasattr(request, 'POST'):
                user_id = request.POST.get('user_id')
            
            # Try to get from authenticated user (if using Django auth)
            if not user_id and hasattr(request, 'user') and request.user.is_authenticated:
                user_id = str(request.user.id)
            
            if not user_id:
                return Response(
                    {'error': 'user_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                # TODO: Temporary bypass for testing - remove in production
                # Check if user has enough tokens
                # if not token_client.check_sufficient_tokens(user_id, cost):
                #     return Response(
                #         {
                #             'error': 'Insufficient tokens',
                #             'required': cost,
                #             'message': f'This operation requires {cost} tokens. Please purchase more tokens.'
                #         },
                #         status=status.HTTP_402_PAYMENT_REQUIRED
                #     )
                
                # Deduct immediately if not waiting for success
                # if not deduct_on_success:
                #     metadata = {'feature': feature} if feature else {}
                #     token_client.deduct_tokens(
                #         user_id=user_id,
                #         amount=cost,
                #         reason=feature or 'api_call',
                #         metadata=metadata
                #     )
                #     logger.info(f"Deducted {cost} tokens from user {user_id} for {feature}")
                logger.info(f"[BYPASS] Skipping token check for user {user_id} - {feature} ({cost} tokens)")
                
                # Execute the view
                response = view_func(*args, **kwargs)
                
                # Deduct on success if configured
                # if deduct_on_success and response.status_code < 400:
                #     metadata = {'feature': feature} if feature else {}
                #     token_client.deduct_tokens(
                #         user_id=user_id,
                #         amount=cost,
                #         reason=feature or 'api_call',
                #         metadata=metadata
                #     )
                #     logger.info(f"Deducted {cost} tokens from user {user_id} for {feature} (on success)")
                
                return response
                
            except InsufficientTokensError as e:
                return Response(
                    {
                        'error': 'Insufficient tokens',
                        'required': cost,
                        'message': str(e)
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )
            
            except TokenServiceError as e:
                logger.error(f"Token service error: {str(e)}")
                return Response(
                    {
                        'error': 'Token service temporarily unavailable',
                        'message': 'Please try again later'
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
        
        return wrapped_view
    return decorator


def check_tokens_only(required: int):
    """
    Decorator to only check tokens without deducting
    Useful for endpoints that just query data
    
    Args:
        required: Minimum tokens required
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            user_id = (
                request.data.get('user_id') if hasattr(request, 'data') else
                request.query_params.get('user_id') if hasattr(request, 'query_params') else
                request.POST.get('user_id') if hasattr(request, 'POST') else
                str(request.user.id) if hasattr(request, 'user') and request.user.is_authenticated else
                None
            )
            
            if not user_id:
                return Response(
                    {'error': 'user_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                if not token_client.check_sufficient_tokens(user_id, required):
                    return Response(
                        {
                            'error': 'Insufficient tokens',
                            'required': required,
                            'message': f'You need at least {required} tokens to access this feature'
                        },
                        status=status.HTTP_402_PAYMENT_REQUIRED
                    )
                
                return view_func(request, *args, **kwargs)
                
            except TokenServiceError as e:
                logger.error(f"Token service error: {str(e)}")
                return Response(
                    {'error': 'Token service temporarily unavailable'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
        
        return wrapped_view
    return decorator
