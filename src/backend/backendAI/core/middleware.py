"""
Custom middleware for the backend AI application
"""
import logging
import time
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(MiddlewareMixin):
    """
    IP-based rate limiting middleware
    
    Limits requests per IP address to prevent abuse
    Uses Django cache (Redis recommended) to track requests
    
    Configuration in settings.py:
        RATE_LIMIT_REQUESTS = 1  # requests per window
        RATE_LIMIT_WINDOW = 1     # seconds
        RATE_LIMIT_ENABLED = True
        RATE_LIMIT_WHITELIST = ['127.0.0.1', '10.0.0.0/8']
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.enabled = getattr(settings, 'RATE_LIMIT_ENABLED', True)
        self.requests_per_window = getattr(settings, 'RATE_LIMIT_REQUESTS', 1)
        self.window_seconds = getattr(settings, 'RATE_LIMIT_WINDOW', 1)
        self.whitelist = set(getattr(settings, 'RATE_LIMIT_WHITELIST', ['127.0.0.1']))
        
    def get_client_ip(self, request):
        """Extract client IP from request"""
        # Check for proxy headers first
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def is_whitelisted(self, ip):
        """Check if IP is whitelisted"""
        return ip in self.whitelist
    
    def process_request(self, request):
        """Check rate limit before processing request"""
        if not self.enabled:
            return None
        
        # Skip rate limiting for static files and admin
        if request.path.startswith('/static/') or request.path.startswith('/admin/'):
            return None
        
        client_ip = self.get_client_ip(request)
        
        # Skip whitelisted IPs
        if self.is_whitelisted(client_ip):
            return None
        
        # Create cache key for this IP
        cache_key = f"rate_limit:{client_ip}"
        
        # Get current request count
        request_count = cache.get(cache_key, 0)
        
        if request_count >= self.requests_per_window:
            # Rate limit exceeded
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JsonResponse(
                {
                    'code': 9999,
                    'message': f'Rate limit exceeded: Maximum {self.requests_per_window} request(s) per {self.window_seconds} second(s)',
                    'result': {'retry_after': self.window_seconds}
                },
                status=429
            )
        
        # Increment request count
        if request_count == 0:
            # First request in window, set with expiry
            cache.set(cache_key, 1, self.window_seconds)
        else:
            # Increment existing count
            cache.incr(cache_key)
        
        return None


class AdvancedRateLimitMiddleware(MiddlewareMixin):
    """
    Advanced rate limiting with multiple tiers
    
    Different limits for different endpoint types:
    - AI operations: 1 req/sec
    - API queries: 10 req/sec
    - Static content: unlimited
    
    Configuration in settings.py:
        RATE_LIMIT_TIERS = {
            'ai_operations': {'requests': 1, 'window': 1},
            'api': {'requests': 10, 'window': 1},
        }
        RATE_LIMIT_PATHS = {
            '/v1/features/': 'ai_operations',
            '/api/v1/chat/': 'ai_operations',
            '/v1/gallery/': 'api',
        }
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.enabled = getattr(settings, 'RATE_LIMIT_ENABLED', True)
        self.tiers = getattr(settings, 'RATE_LIMIT_TIERS', {
            'ai_operations': {'requests': 1, 'window': 1},
            'api': {'requests': 10, 'window': 1},
        })
        self.path_mapping = getattr(settings, 'RATE_LIMIT_PATHS', {
            '/v1/features/': 'ai_operations',
            '/api/v1/chat/': 'ai_operations',
            '/v1/gallery/': 'api',
        })
        self.whitelist = set(getattr(settings, 'RATE_LIMIT_WHITELIST', ['127.0.0.1']))
    
    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def get_tier_for_path(self, path):
        """Determine rate limit tier based on request path"""
        for prefix, tier in self.path_mapping.items():
            if path.startswith(prefix):
                return tier
        return None  # No rate limit
    
    def process_request(self, request):
        """Check rate limit before processing request"""
        if not self.enabled:
            return None
        
        client_ip = self.get_client_ip(request)
        
        # Skip whitelisted IPs
        if client_ip in self.whitelist:
            return None
        
        # Determine tier
        tier_name = self.get_tier_for_path(request.path)
        if not tier_name or tier_name not in self.tiers:
            return None  # No rate limit for this path
        
        tier_config = self.tiers[tier_name]
        max_requests = tier_config['requests']
        window = tier_config['window']
        
        # Create cache key
        cache_key = f"rate_limit:{tier_name}:{client_ip}"
        
        # Check current count
        request_count = cache.get(cache_key, 0)
        
        if request_count >= max_requests:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on tier {tier_name}")
            return JsonResponse(
                {
                    'code': 9999,
                    'message': f'Rate limit exceeded: Maximum {max_requests} request(s) per {window} second(s) for {tier_name}',
                    'result': {'tier': tier_name, 'retry_after': window}
                },
                status=429
            )
        
        # Increment count
        if request_count == 0:
            cache.set(cache_key, 1, window)
        else:
            cache.incr(cache_key)
        
        return None


class InputSanitizationMiddleware(MiddlewareMixin):
    """
    Sanitize user inputs to prevent injection attacks
    
    Protects against:
    - NoSQL injection (MongoDB operators like $where, $regex)
    - XSS (though Django templates auto-escape)
    - Prompt injection for AI models
    - Path traversal
    
    Configuration in settings.py:
        INPUT_SANITIZATION_ENABLED = True
        INPUT_SANITIZATION_STRICT_MODE = False  # If True, reject instead of sanitize
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.enabled = getattr(settings, 'INPUT_SANITIZATION_ENABLED', True)
        self.strict_mode = getattr(settings, 'INPUT_SANITIZATION_STRICT_MODE', False)
        
        # Dangerous MongoDB operators
        self.mongodb_operators = [
            '$where', '$regex', '$expr', '$function',
            '$accumulator', '$addFields', '$bucket',
        ]
        
        # Dangerous patterns
        self.dangerous_patterns = [
            '../',  # Path traversal
            '..\\',  # Windows path traversal
            '<script',  # XSS
            'javascript:',  # XSS
            'onerror=',  # XSS
            'onclick=',  # XSS
        ]
    
    def sanitize_value(self, value):
        """Sanitize a single value"""
        if not isinstance(value, str):
            return value
        
        # Check for MongoDB operators
        for op in self.mongodb_operators:
            if op in value.lower():
                if self.strict_mode:
                    raise ValueError(f"Dangerous operator detected: {op}")
                # Remove the operator
                value = value.replace(op, '').replace(op.upper(), '')
        
        # Check for dangerous patterns
        for pattern in self.dangerous_patterns:
            if pattern.lower() in value.lower():
                if self.strict_mode:
                    raise ValueError(f"Dangerous pattern detected: {pattern}")
                # Remove the pattern
                value = value.replace(pattern, '').replace(pattern.upper(), '')
        
        # Limit length to prevent DoS
        max_length = getattr(settings, 'INPUT_MAX_LENGTH', 10000)
        if len(value) > max_length:
            if self.strict_mode:
                raise ValueError(f"Input too long: {len(value)} > {max_length}")
            value = value[:max_length]
        
        return value.strip()
    
    def sanitize_dict(self, data):
        """Recursively sanitize dictionary"""
        if not isinstance(data, dict):
            return data
        
        sanitized = {}
        for key, value in data.items():
            # Sanitize key
            clean_key = self.sanitize_value(key) if isinstance(key, str) else key
            
            # Sanitize value
            if isinstance(value, dict):
                clean_value = self.sanitize_dict(value)
            elif isinstance(value, list):
                clean_value = [self.sanitize_dict(item) if isinstance(item, dict) else self.sanitize_value(item) for item in value]
            else:
                clean_value = self.sanitize_value(value)
            
            sanitized[clean_key] = clean_value
        
        return sanitized
    
    def process_request(self, request):
        """Sanitize request data"""
        if not self.enabled:
            return None
        
        # Skip for certain paths
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return None
        
        try:
            # Sanitize GET parameters
            if request.GET:
                request.GET = request.GET.copy()
                for key in list(request.GET.keys()):
                    value = request.GET[key]
                    request.GET[key] = self.sanitize_value(value)
            
            # Sanitize POST data (for form data, not JSON)
            if request.POST:
                request.POST = request.POST.copy()
                for key in list(request.POST.keys()):
                    value = request.POST[key]
                    request.POST[key] = self.sanitize_value(value)
            
            # Sanitize JSON body (for DRF)
            if hasattr(request, 'data') and isinstance(request.data, dict):
                request._full_data = self.sanitize_dict(request.data)
        
        except ValueError as e:
            logger.warning(f"Input sanitization rejected request: {str(e)}")
            return JsonResponse(
                {
                    'code': 9999,
                    'message': 'Your input contains potentially dangerous content',
                    'result': {'detail': str(e)}
                },
                status=400
            )
        
        return None


class RequestLoggingMiddleware(MiddlewareMixin):
    """Middleware to log all requests"""
    
    def process_request(self, request):
        request._start_time = time.time()
        logger.info(f"Request: {request.method} {request.path}")
        return None
    
    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            logger.info(
                f"Response: {request.method} {request.path} "
                f"Status: {response.status_code} Duration: {duration:.2f}s"
            )
        return response


class CORSMiddleware(MiddlewareMixin):
    """Custom CORS middleware (if not using django-cors-headers)"""
    
    def process_response(self, request, response):
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
