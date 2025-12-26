"""
Token Service Decorators - Centralized token tracking for AI features

RECOMMENDED USAGE:
    from core.token_decorators import with_token_tracking
    
    @with_token_tracking('image_generation')
    def my_view(request):
        # Automatically:
        # 1. Checks user balance (estimated_tokens from config)
        # 2. Tracks processing time
        # 3. Deducts tokens: max(actual_cost, min_deduction)
        return Response(...)

LEGACY DECORATORS (still available but not recommended):
    - require_tokens: Fixed cost deduction
    - track_processing_time: Time-based deduction
    - check_tokens_only: Balance check only
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


# ============================================================================
# RECOMMENDED: Modern decorator with centralized config
# ============================================================================

def with_token_tracking(feature_name: str):
    """
    Modern decorator using centralized TokenConfig
    Automatically handles balance check, time tracking, and token deduction
    
    Uses config from core.token_config.TokenConfig with:
    - estimated_tokens: Pre-check balance requirement
    - min_deduction: Minimum tokens to charge
    - token_per_second: Deduction rate
    
    Formula: tokens_charged = max(processing_time * token_per_second, min_deduction)
    
    Args:
        feature_name: Feature name (must exist in TokenConfig)
        
    Usage:
        from core.token_decorators import with_token_tracking
        
        @with_token_tracking('image_generation')
        def my_view(request):
            return Response(...)
    
    Example:
        Feature config: estimated_tokens=50, min_deduction=20, token_per_second=2.0
        
        - User has 45 tokens → Rejected (need 50)
        - User has 60 tokens, processing takes 3s → Deduct max(6, 20) = 20 tokens
        - User has 60 tokens, processing takes 15s → Deduct max(30, 20) = 30 tokens
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
                # Get feature configuration
                config = TokenConfig.get_config(feature_name)
                display_name = config['display_name']
                estimated_tokens = config['estimated_tokens']
                min_deduction = config['min_deduction']
                token_per_second = config['token_per_second']
                
                logger.info(
                    f"[{feature_name}] Processing request for user {user_id} "
                    f"(estimated: {estimated_tokens}, min: {min_deduction}, rate: {token_per_second}/s)"
                )
                
                # ============================================================
                # STEP 1: Check if token service is available
                # ============================================================
                try:
                    balance = token_client.get_user_tokens(user_id)
                except Exception as e:
                    logger.error(f"[{feature_name}] Token service unavailable: {e}")
                    return Response(
                        {
                            'error': 'Token service is currently unavailable',
                            'message': 'Please try again later.',
                            'feature': display_name
                        },
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )
                
                # ============================================================
                # STEP 2: Validate balance using TokenConfig
                # ============================================================
                is_valid, error_message = TokenConfig.validate_balance(feature_name, balance)
                if not is_valid:
                    logger.warning(
                        f"[{feature_name}] User {user_id} has insufficient balance: "
                        f"{balance} tokens. {error_message}"
                    )
                    return Response(
                        {
                            'error': 'Insufficient tokens',
                            'message': error_message,
                            'current_balance': balance,
                            'estimated_tokens': estimated_tokens,
                            'minimum_required': TokenConfig.MIN_TOKEN_REQUIRED,
                            'feature': display_name
                        },
                        status=status.HTTP_402_PAYMENT_REQUIRED
                    )
                
                logger.info(
                    f"[{feature_name}] User {user_id} has sufficient balance: "
                    f"{balance} >= {estimated_tokens} tokens"
                )
                
                # ============================================================
                # STEP 3: Execute the feature and track time
                # ============================================================
                start_time = time.time()
                response = view_func(*args, **kwargs)
                processing_time = time.time() - start_time
                
                # ============================================================
                # STEP 4: Calculate cost and deduct tokens
                # ============================================================
                if hasattr(response, 'status_code') and 200 <= response.status_code < 300:
                    # Calculate cost: max(actual_cost, min_deduction)
                    tokens_to_deduct = TokenConfig.calculate_cost(feature_name, processing_time)
                    
                    try:
                        token_client.deduct_tokens(
                            user_id=user_id,
                            amount=tokens_to_deduct,
                            reason=f"{display_name} - {processing_time:.2f}s",
                            metadata={
                                'feature': feature_name,
                                'processing_time': processing_time,
                                'rate': token_per_second,
                                'min_deduction': min_deduction,
                                'actual_cost': int(processing_time * token_per_second)
                            }
                        )
                        
                        new_balance = balance - tokens_to_deduct
                        logger.info(
                            f"[{feature_name}] Deducted {tokens_to_deduct} tokens from user {user_id}. "
                            f"Processing time: {processing_time:.2f}s. "
                            f"Calculation: max({int(processing_time * token_per_second)}, {min_deduction}) = {tokens_to_deduct}. "
                            f"New balance: {new_balance}"
                        )
                        
                        # Warning if balance is getting low
                        if new_balance < TokenConfig.MIN_TOKEN_REQUIRED * 3:
                            logger.warning(
                                f"[{feature_name}] User {user_id} has low balance: {new_balance} tokens"
                            )
                        
                    except Exception as e:
                        logger.error(
                            f"[{feature_name}] Failed to deduct tokens for user {user_id}: {e}"
                        )
                        # Don't fail the request if deduction fails
                        # The user already got the result
                else:
                    logger.info(
                        f"[{feature_name}] Skipped token deduction for user {user_id} "
                        f"(response status: {response.status_code})"
                    )
                
                return response
                
            except ValueError as e:
                # Feature not found in TokenConfig
                logger.error(f"Invalid feature name: {feature_name}. {str(e)}")
                return Response(
                    {
                        'error': 'Configuration error',
                        'message': f'Feature "{feature_name}" is not properly configured'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            except InsufficientTokensError as e:
                return Response(
                    {
                        'error': 'Insufficient tokens',
                        'message': str(e)
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )
            
            except TokenServiceError as e:
                logger.error(f"[{feature_name}] Token service error: {str(e)}")
                return Response(
                    {
                        'error': 'Token service temporarily unavailable',
                        'message': 'Please try again later'
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
        
        return wrapped_view
    return decorator


# ============================================================================
# LEGACY: Old decorators (still supported but not recommended)
# ============================================================================

def require_tokens(cost: int, feature: str = None, deduct_on_success: bool = False):
    """
    LEGACY: Decorator with fixed cost (not recommended - use with_token_tracking instead)
    
    Args:
        cost: Number of tokens required
        feature: Feature name for logging/metadata
        deduct_on_success: If True, only deduct after successful execution
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(*args, **kwargs):
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
                logger.info(f"[LEGACY] require_tokens: {feature} - {cost} tokens")
                
                if not token_client.check_sufficient_tokens(user_id, cost):
                    return Response(
                        {
                            'error': 'Insufficient tokens',
                            'required': cost,
                            'message': f'This operation requires {cost} tokens.'
                        },
                        status=status.HTTP_402_PAYMENT_REQUIRED
                    )
                
                if not deduct_on_success:
                    token_client.deduct_tokens(
                        user_id=user_id,
                        amount=cost,
                        reason=feature or 'api_call'
                    )
                
                response = view_func(*args, **kwargs)
                
                if deduct_on_success and response.status_code < 400:
                    token_client.deduct_tokens(
                        user_id=user_id,
                        amount=cost,
                        reason=feature or 'api_call'
                    )
                
                return response
                
            except (InsufficientTokensError, TokenServiceError) as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_402_PAYMENT_REQUIRED if isinstance(e, InsufficientTokensError) else status.HTTP_503_SERVICE_UNAVAILABLE
                )
        
        return wrapped_view
    return decorator


def track_processing_time(feature: str, min_required_tokens: int = 10):
    """
    LEGACY: Time-based tracking without centralized config (not recommended)
    
    Use with_token_tracking('feature_name') instead
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(*args, **kwargs):
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
                if not token_client.check_sufficient_tokens(user_id, min_required_tokens):
                    balance = token_client.get_user_tokens(user_id)
                    return Response(
                        {
                            'error': 'Insufficient tokens',
                            'current_balance': balance,
                            'minimum_required': min_required_tokens
                        },
                        status=status.HTTP_402_PAYMENT_REQUIRED
                    )
                
                start_time = time.time()
                response = view_func(*args, **kwargs)
                processing_time = time.time() - start_time
                
                if hasattr(response, 'status_code') and 200 <= response.status_code < 300:
                    tokens_to_deduct = token_client.calculate_tokens_from_processing_time(processing_time)
                    token_client.deduct_tokens(
                        user_id=user_id,
                        amount=tokens_to_deduct,
                        reason=feature,
                        metadata={'processing_time': processing_time}
                    )
                    logger.info(f"[{feature}] Deducted {tokens_to_deduct} tokens ({processing_time:.2f}s)")
                
                return response
                
            except (InsufficientTokensError, TokenServiceError) as e:
                logger.warning(f"[{feature}] Token service unavailable, allowing request")
                return view_func(*args, **kwargs)
        
        return wrapped_view
    return decorator


def check_tokens_only(required: int):
    """
    LEGACY: Check tokens without deducting
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
                            'required': required
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
