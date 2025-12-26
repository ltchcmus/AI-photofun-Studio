"""
Token Service Client - Integrates with external token management API

API Endpoints:
    - GET /api/v1/identity/users/tokens/{user_id} - Check token balance
    - PATCH /api/v1/identity/users/modify-tokens - Deduct tokens

Usage:
    from core.token_client import token_client
    
    balance = token_client.get_user_tokens(user_id="user123")
    success = token_client.deduct_tokens(user_id="user123", amount=10, reason="image_generation")
"""

import requests
import logging
import math
from typing import Optional, Dict, Any
from django.conf import settings
from core.exceptions import InsufficientTokensError, TokenServiceError

logger = logging.getLogger(__name__)


class TokenClient:
    """Client for external token management API"""
    
    def __init__(self):
        self.base_url = getattr(settings, 'TOKEN_SERVICE_URL', None)
        self.api_key_1 = getattr(settings, 'TOKEN_API_KEY_1', None)
        self.api_key_2 = getattr(settings, 'TOKEN_API_KEY_2', None)
        self.timeout = getattr(settings, 'TOKEN_SERVICE_TIMEOUT', 10)  # seconds
        
        if not self.base_url:
            logger.warning("TOKEN_SERVICE_URL not configured in settings")
        if not self.api_key_1 or not self.api_key_2:
            logger.warning("TOKEN_API_KEY_1 or TOKEN_API_KEY_2 not configured")
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request to token service
        
        Args:
            method: HTTP method (GET, PATCH, etc.)
            endpoint: API endpoint path
            **kwargs: Additional request parameters
            
        Returns:
            Response JSON data
            
        Raises:
            TokenServiceError: When API request fails
        """
        if not self.base_url:
            raise TokenServiceError("Token service not configured")
        
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        headers = kwargs.pop('headers', {})
        
        # Add required API keys
        if self.api_key_1 and self.api_key_2:
            headers['api-key-1'] = self.api_key_1
            headers['api-key-2'] = self.api_key_2
        else:
            logger.warning("Token service API keys not configured")
        
        headers['Content-Type'] = 'application/json'
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            
            # Check if response is JSON
            content_type = response.headers.get('content-type', '')
            if 'application/json' not in content_type:
                logger.error(f"Token service returned non-JSON response. Content-Type: {content_type}")
                logger.error(f"Response body preview: {response.text[:500]}")
                raise TokenServiceError(f"Token service returned HTML/non-JSON response. Check server configuration.")
            
            return response.json()
            
        except requests.exceptions.Timeout:
            logger.error(f"Token service timeout: {url}")
            raise TokenServiceError("Token service timeout")
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"Token service HTTP error: {e.response.status_code} - {e.response.text}")
            
            # Handle specific HTTP errors
            if e.response.status_code == 400:
                try:
                    data = e.response.json()
                    if 'insufficient' in str(data).lower():
                        raise InsufficientTokensError("User has insufficient tokens")
                except Exception:
                    pass
            
            raise TokenServiceError(f"Token service error: {e.response.status_code}")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Token service request failed: {str(e)}")
            raise TokenServiceError(f"Token service unavailable: {str(e)}")
    
    def get_user_tokens(self, user_id: str) -> int:
        """
        Get current token balance for user
        
        Args:
            user_id: User identifier
            
        Returns:
            Current token balance
            
        Raises:
            TokenServiceError: When API request fails
        """
        try:
            logger.debug(f"Fetching token balance for user {user_id}")
            # GET /api/v1/identity/users/tokens/{user_id}
            response = self._make_request('GET', f'/api/v1/identity/users/tokens/{user_id}')
            
            # Response format: {"result": {"tokens": 1000}}
            result = response.get('result', {})
            return int(result.get('tokens', 0))
            
        except Exception as e:
            logger.error(f"Failed to get tokens for user {user_id}: {str(e)}")
            raise
    
    def deduct_tokens(
        self, 
        user_id: str, 
        amount: int, 
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Deduct tokens from user balance
        
        Args:
            user_id: User identifier
            amount: Number of tokens to deduct (will be converted to string)
            reason: Reason for deduction (e.g., "image_generation")
            metadata: Additional context (e.g., {"feature": "upscale", "image_id": "..."})
            
        Returns:
            True if deduction successful
            
        Raises:
            InsufficientTokensError: When user doesn't have enough tokens
            TokenServiceError: When API request fails
        """
        try:
            payload = {
                'userId': user_id,
                'tokens': str(amount),  # API expects string
            }
            
            # Log the deduction for audit trail
            logger.info(f"Deducting {amount} tokens from user {user_id}. Reason: {reason}")
            
            # PATCH /api/v1/identity/users/modify-tokens
            response = self._make_request('PATCH', '/api/v1/identity/users/modify-tokens', json=payload)
            
            # Response format: {"code": 1000, "message": "success", "result": ...}
            success = response.get('code') == 1000
            
            if success:
                logger.info(f"Successfully deducted {amount} tokens from user {user_id}")
            else:
                logger.warning(f"Token deduction returned non-success code: {response}")
            
            return success
            
        except InsufficientTokensError:
            raise
        except Exception as e:
            logger.error(f"Failed to deduct tokens for user {user_id}: {str(e)}")
            raise TokenServiceError(f"Token deduction failed: {str(e)}")
    
    def check_sufficient_tokens(self, user_id: str, required: int) -> bool:
        """
        Check if user has sufficient tokens (without deducting)
        
        Args:
            user_id: User identifier
            required: Required token amount
            
        Returns:
            True if user has enough tokens
        """
        try:
            balance = self.get_user_tokens(user_id)
            return balance >= required
        except Exception as e:
            logger.error(f"Failed to check user: {user_id} token balance: {str(e)}")
            return False
    
    @staticmethod
    def calculate_tokens_from_processing_time(processing_time_seconds: float) -> int:
        """
        Calculate tokens to deduct based on processing time
        Formula: ceil(processing_time * 2)
        
        Args:
            processing_time_seconds: Processing time in seconds
            
        Returns:
            Tokens to deduct (rounded up)
        """
        return math.ceil(processing_time_seconds * 5)


# Singleton instance for easy import
token_client = TokenClient()
