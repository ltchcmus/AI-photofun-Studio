"""
JWT Authentication Module for Django

Usage:
    from core.auth import require_auth, require_role, require_authority

    @require_auth
    def has_login(request):
        # Only authenticated users can access
    
    @require_role('ADMIN', 'PREMIUM')
    def premium_func(request):
        # Only ADMIN or PREMIUM users can access
"""

from email import message
import jwt
from datetime import datetime, timezone
from functools import wraps
from django.http import JsonResponse
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


# Read from Django settings (which loads from .env)
SECRET = getattr(settings, 'JWT_SECRET_KEY', '')
ALGORITHM = getattr(settings, 'JWT_ALGORITHM', 'HS512')
ISSUER = getattr(settings, 'JWT_ISSUER', 'ThanhCong')
AUDIENCE = getattr(settings, 'JWT_AUDIENCE', 'NMCNPM-CLIENT')


class AppException(Exception):
    def __init__(self, message, code, error = None):
        super().__init__(message)
        self.code = code
        if error is not None:
            self.error = error



def extract_token_from_header(request):
    auth_header = request.headers.get('Authorization', '')
    logger.debug(f"[AUTH DEBUG] Authorization header: {auth_header[:50]}..." if len(auth_header) > 50 else f"[AUTH DEBUG] Authorization header: {auth_header}")
    
    if not auth_header:
        logger.warning("[AUTH DEBUG] No Authorization header found")
        return None
    parts = auth_header.split()
    
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        logger.warning(f"[AUTH DEBUG] Invalid Authorization header format: {parts}")
        return None
    
    logger.debug(f"[AUTH DEBUG] Token extracted successfully")
    return parts[1]


def verify_jwt_token(token):
    try:
        payload = jwt.decode(
            token,
            SECRET,
            algorithms=[ALGORITHM],
            issuer=ISSUER,
            audience=AUDIENCE,
            options={
                'verify_signature': True,
                'verify_exp': True,  
                'verify_iss': True, 
                'verify_aud': True,  
            }
        )
    
        token_type = payload.get('type', '')
        if token_type != 'access':
            raise AppException("Token type must be 'access', not 'refresh'", code=401)
        
        user_id = payload.get('sub')
        scope = payload.get('scope', '')
        logger.info(f"[AUTH DEBUG] Token verified successfully for user: {user_id}")
        logger.info(f"[AUTH DEBUG] Token scope: {scope}")
        logger.info(f"[AUTH DEBUG] Full payload: {payload}")
        return payload
        
    except jwt.ExpiredSignatureError:
        raise AppException("Token has expired", code=401)
    
    except jwt.InvalidSignatureError:
        raise AppException("Invalid token signature", code=401)
    
    except jwt.InvalidIssuerError:
        raise AppException("Invalid token issuer", code=401)
    
    except jwt.InvalidAudienceError:
        raise AppException("Invalid token audience", code=401)
    
    except jwt.DecodeError:
        raise AppException("Token decode error", code=401)
    
    except Exception as e:
        logger.error(f"JWT verification error: {str(e)}")
        raise AppException(f"Token verification failed: {str(e)}", code=401)

def check_token_validity(token):
    try:
        verify_jwt_token(token)
        return True
    except AppException:
        return False


def has_role(payload, role_name):
    scope = payload.get('scope', '')
    role_key = f"ROLE_{role_name.upper()}"

    permissions = scope.split()
    has_it = role_key in permissions
    
    logger.debug(f"[AUTH DEBUG] Checking role '{role_name}' -> Looking for '{role_key}' in {permissions} -> Result: {has_it}")
    return has_it


def has_authority(payload, authority_name):
    scope = payload.get('scope', '')
    permissions = scope.split()
    return authority_name.upper() in permissions


def get_user_roles(payload):
    scope = payload.get('scope', '')
    permissions = scope.split()
    
    roles = []
    for perm in permissions:
        if perm.startswith('ROLE_'):
            role_name = perm.replace('ROLE_', '')
            roles.append(role_name)
    
    return roles


def get_user_authorities(payload):
    scope = payload.get('scope', '')
    permissions = scope.split()
    authorities = [perm for perm in permissions if not perm.startswith('ROLE_')]
    
    return authorities


def require_auth(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            # Extract token
            token = extract_token_from_header(request)
            
            if not token:
                return JsonResponse(
                    {
                        'code': 1002,
                        'message': 'Missing or invalid Authorization header'
                    },
                    status=401
                )
            
            payload = verify_jwt_token(token)
            
            request.user_id = payload.get('sub')
            request.jwt_payload = payload
            request.user_roles = get_user_roles(payload)
            request.user_authorities = get_user_authorities(payload)
            
            return view_func(request, *args, **kwargs)
            
        except AppException as e:
            return JsonResponse(
                {
                    'code': 1002,
                    'message': str(e)
                },
                status=401
            )
    
    return wrapper


def require_role(*required_roles):
    def decorator(view_func):
        @wraps(view_func)
        @require_auth 
        def wrapper(request, *args, **kwargs):
            payload = request.jwt_payload
            user_roles = get_user_roles(payload)
            
            logger.info(f"[AUTH DEBUG] require_role check - Required: {required_roles}, User has: {user_roles}")

            has_required_role = any(
                has_role(payload, role) for role in required_roles
            )
            
            if not has_required_role:
                logger.warning(f"[AUTH DEBUG] Access DENIED - User roles {user_roles} do not match required {required_roles}")
                return JsonResponse(
                    {
                        'code': 1005,
                        'message': f'Forbidden: Required role(s): {", ".join(required_roles)}'
                    },
                    status=403
                )
            
            logger.info(f"[AUTH DEBUG] Access GRANTED - User has required role")
            return view_func(request, *args, **kwargs)
        
        return wrapper
    
    return decorator


def require_authority(*required_authorities):
    def decorator(view_func):
        @wraps(view_func)
        @require_auth
        def wrapper(request, *args, **kwargs):
            payload = request.jwt_payload
        
            has_required_authority = any(
                has_authority(payload, auth) for auth in required_authorities
            )
            
            if not has_required_authority:
                return JsonResponse(
                    {
                        'code': 1005,
                        'message': f'Forbidden: Required authority: {", ".join(required_authorities)}'
                    },
                    status=403
                )
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    
    return decorator


