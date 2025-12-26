"""
Token Service Decorators - Easy-to-use decorators for protecting views

Usage:
    from core.token_decorators import with_token_tracking
    
    # Recommended: Use centralized config
    @with_token_tracking('image_generation')
    def generate_image_view(request):
        # Automatically checks balance, tracks time, and deducts tokens
        return Response(...)
    
    # Legacy: Manual config (not recommended)
    @require_tokens(cost=10, feature="image_generation")
    def some_view(request):
        return Response(...)
"""

from functools import wraps
import time
from rest_framework.response import Response
from rest_framework import status
from core.token_client import token_client
from core.token_config import TokenConfig
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


def track_processing_time(feature: str, min_required_tokens: int = 10):
    """
    Decorator to track processing time and deduct tokens based on actual time
    Formula: tokens = ceil(processing_time_seconds * 2)
    
    Args:
        feature: Feature name for logging
        min_required_tokens: Minimum tokens user must have to start (safety check)
        
    Usage:
        @track_processing_time(feature="image_generation", min_required_tokens=10)
        def my_view(request):
            # Tokens will be deducted based on actual processing time
            return Response(...)
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(*args, **kwargs):
            # Extract request from args (handle both function and class views)
            request = None
            if len(args) > 0 and hasattr(args[0], 'data'):
                request = args[0]
            elif len(args) > 1 and hasattr(args[1], 'data'):
                request = args[1]
            
            if not request:
                return Response(
                    {'error': 'Invalid request'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extract user_id
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
                # Check minimum balance before starting
                if not token_client.check_sufficient_tokens(user_id, min_required_tokens):
                    balance = token_client.get_user_tokens(user_id)
                    return Response(
                        {
                            'error': 'Insufficient tokens',
                            'current_balance': balance,
                            'minimum_required': min_required_tokens,
                            'message': f'You need at least {min_required_tokens} tokens to start this operation'
                        },
                        status=status.HTTP_402_PAYMENT_REQUIRED
                    )
                
                # Track processing time
                start_time = time.time()
                logger.info(f"[{feature}] Started processing for user {user_id}")
                
                # Execute view
                response = view_func(*args, **kwargs)
                
                # Calculate processing time
                processing_time = time.time() - start_time
                tokens_to_deduct = token_client.calculate_tokens_from_processing_time(processing_time)
                
                # Deduct tokens only on success (2xx status codes)
                if hasattr(response, 'status_code') and 200 <= response.status_code < 300:
                    token_client.deduct_tokens(
                        user_id=user_id,
                        amount=tokens_to_deduct,
                        reason=feature,
                        metadata={'processing_time': processing_time}
                    )
                    logger.info(
                        f"[{feature}] Deducted {tokens_to_deduct} tokens from user {user_id} "
                        f"(processing time: {processing_time:.2f}s)"
                    )
                else:
                    logger.info(
                        f"[{feature}] Skipped token deduction for user {user_id} "
                        f"(response status: {response.status_code})"
                    )
                
                return response
                
            except InsufficientTokensError as e:
                return Response(
                    {
                        'error': 'Insufficient tokens',
                        'message': str(e)
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )
            
            except TokenServiceError as e:
                logger.error(f"Token service error: {str(e)}")
                # Don't fail the request if token service is down (graceful degradation)
                logger.warning(f"[{feature}] Token service unavailable, allowing request to proceed")
                return view_func(*args, **kwargs)
        
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
