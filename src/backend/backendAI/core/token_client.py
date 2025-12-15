"""
Token Service Client - Integrates with external token management API

Usage:
    from core.token_client import token_client
    
    balance = token_client.get_user_tokens(user_id="user123")
    success = token_client.deduct_tokens(user_id="user123", amount=10, reason="image_generation")
"""

import requests
import logging
from typing import Optional, Dict, Any
from django.conf import settings
from core.exceptions import InsufficientTokensError, TokenServiceError

logger = logging.getLogger(__name__)


class TokenClient:
    """Client for external token management API"""
    
    def __init__(self):
        self.base_url = getattr(settings, 'TOKEN_SERVICE_URL', None)
        self.api_key = getattr(settings, 'TOKEN_SERVICE_API_KEY', None)
        self.timeout = getattr(settings, 'TOKEN_SERVICE_TIMEOUT', 5)  # seconds
        
        if not self.base_url:
            logger.warning("TOKEN_SERVICE_URL not configured in settings")
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request to token service
        
        Args:
            method: HTTP method (GET, POST, etc.)
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
        
        # Add API key authentication if configured
        if self.api_key:
            headers['Authorization'] = f"Bearer {self.api_key}"
        
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
            return response.json()
            
        except requests.exceptions.Timeout:
            logger.error(f"Token service timeout: {url}")
            raise TokenServiceError("Token service timeout")
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"Token service HTTP error: {e.response.status_code} - {e.response.text}")
            
            # Handle specific HTTP errors
            if e.response.status_code == 400:
                data = e.response.json() if e.response.headers.get('content-type') == 'application/json' else {}
                if 'insufficient' in str(data).lower():
                    raise InsufficientTokensError("User has insufficient tokens")
            
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
            # Adjust endpoint according to your friend's API spec
            response = self._make_request('GET', f'/users/{user_id}/tokens')
            
            # Adjust field name according to actual API response
            # Example: {"user_id": "123", "balance": 100, "updated_at": "..."}
            return response.get('balance', 0)
            
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
            amount: Number of tokens to deduct
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
                'user_id': user_id,
                'amount': amount,
            }
            
            if reason:
                payload['reason'] = reason
            
            if metadata:
                payload['metadata'] = metadata
            
            # Adjust endpoint according to your friend's API spec
            response = self._make_request('POST', f'/users/{user_id}/tokens/deduct', json=payload)
            
            # Check if deduction was successful
            # Adjust according to actual API response
            return response.get('success', False)
            
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
            logger.error(f"Failed to check token balance: {str(e)}")
            return False


# Singleton instance for easy import
token_client = TokenClient()
