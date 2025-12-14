"""
Input validation utilities for enhanced security

These validators work alongside middleware for defense-in-depth
Use in serializers and views for specific validation needs
"""

import re
from typing import Any, List, Optional
from rest_framework import serializers


class PromptValidator:
    """
    Validate AI prompts to prevent prompt injection and jailbreak attempts
    
    Detects:
    - System prompt injection attempts
    - Role-playing attacks
    - Instruction override attempts
    - Excessive repetition (DoS)
    """
    
    # Dangerous prompt patterns
    INJECTION_PATTERNS = [
        r'ignore\s+(previous|above|prior)\s+instructions?',
        r'forget\s+(everything|all|previous)',
        r'you\s+are\s+(now|a)\s+',  # Role-playing
        r'system\s*:',  # System prompt injection
        r'<\|im_start\|>',  # ChatML injection
        r'<\|endoftext\|>',  # Token injection
        r'\[INST\]',  # Llama instruction injection
        r'###\s*instruction',  # Alpaca format
    ]
    
    @classmethod
    def validate(cls, prompt: str, strict: bool = False) -> str:
        """
        Validate and sanitize prompt
        
        Args:
            prompt: User prompt to validate
            strict: If True, raise error instead of sanitizing
            
        Returns:
            Sanitized prompt
            
        Raises:
            ValidationError: If strict mode and dangerous pattern found
        """
        if not prompt or not isinstance(prompt, str):
            raise serializers.ValidationError("Prompt must be a non-empty string")
        
        # Check length
        if len(prompt) > 2000:
            if strict:
                raise serializers.ValidationError("Prompt too long (max 2000 characters)")
            prompt = prompt[:2000]
        
        # Check for injection patterns
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, prompt, re.IGNORECASE):
                if strict:
                    raise serializers.ValidationError(
                        "Prompt contains potentially dangerous instructions"
                    )
                # Remove the pattern
                prompt = re.sub(pattern, '', prompt, flags=re.IGNORECASE)
        
        # Check for excessive repetition (DoS attack)
        if cls._has_excessive_repetition(prompt):
            if strict:
                raise serializers.ValidationError("Prompt contains excessive repetition")
            # Truncate repeated sections
            prompt = cls._remove_repetition(prompt)
        
        return prompt.strip()
    
    @staticmethod
    def _has_excessive_repetition(text: str, threshold: int = 5) -> bool:
        """Check if text has same phrase repeated too many times"""
        words = text.split()
        if len(words) < 10:
            return False
        
        # Check for 3-word phrases repeated more than threshold
        phrases = {}
        for i in range(len(words) - 2):
            phrase = ' '.join(words[i:i+3])
            phrases[phrase] = phrases.get(phrase, 0) + 1
            if phrases[phrase] > threshold:
                return True
        
        return False
    
    @staticmethod
    def _remove_repetition(text: str) -> str:
        """Remove excessively repeated phrases"""
        words = text.split()
        result = []
        phrase_counts = {}
        
        i = 0
        while i < len(words):
            if i + 2 < len(words):
                phrase = ' '.join(words[i:i+3])
                count = phrase_counts.get(phrase, 0)
                
                if count < 3:  # Allow up to 3 repetitions
                    result.extend(words[i:i+3])
                    phrase_counts[phrase] = count + 1
                    i += 3
                else:
                    i += 3  # Skip this repetition
            else:
                result.append(words[i])
                i += 1
        
        return ' '.join(result)


class URLValidator:
    """
    Validate URLs to prevent SSRF and path traversal
    
    Only allows:
    - HTTPS URLs from whitelisted domains
    - Public image hosting services
    """
    
    ALLOWED_DOMAINS = [
        'cloudinary.com',
        'imgur.com',
        'i.imgur.com',
        'unsplash.com',
        'images.unsplash.com',
        'pexels.com',
        'images.pexels.com',
    ]
    
    # Blocked private IP ranges
    BLOCKED_IPS = [
        r'^127\.',  # Localhost
        r'^10\.',   # Private class A
        r'^172\.(1[6-9]|2[0-9]|3[0-1])\.',  # Private class B
        r'^192\.168\.',  # Private class C
        r'^169\.254\.',  # Link-local
        r'^::1$',  # IPv6 localhost
        r'^fc00:',  # IPv6 private
    ]
    
    @classmethod
    def validate(cls, url: str, allow_custom_domains: bool = False) -> str:
        """
        Validate URL for security
        
        Args:
            url: URL to validate
            allow_custom_domains: If True, allow domains not in whitelist
            
        Returns:
            Validated URL
            
        Raises:
            ValidationError: If URL is invalid or dangerous
        """
        if not url or not isinstance(url, str):
            raise serializers.ValidationError("URL must be a non-empty string")
        
        # Must be HTTPS
        if not url.startswith('https://'):
            raise serializers.ValidationError("Only HTTPS URLs are allowed")
        
        # Extract domain
        match = re.match(r'https://([^/]+)', url)
        if not match:
            raise serializers.ValidationError("Invalid URL format")
        
        domain = match.group(1)
        
        # Check if domain is in whitelist
        if not allow_custom_domains:
            if not any(allowed in domain for allowed in cls.ALLOWED_DOMAINS):
                raise serializers.ValidationError(
                    f"Domain not in whitelist. Allowed: {', '.join(cls.ALLOWED_DOMAINS)}"
                )
        
        # Check for IP address instead of domain (SSRF protection)
        if re.match(r'^\d+\.\d+\.\d+\.\d+', domain):
            # Check if it's a blocked private IP
            for pattern in cls.BLOCKED_IPS:
                if re.match(pattern, domain):
                    raise serializers.ValidationError("Access to private IPs is not allowed")
        
        # Check for path traversal in URL path
        if '../' in url or '..\\' in url:
            raise serializers.ValidationError("Path traversal detected in URL")
        
        return url


class FileNameValidator:
    """
    Validate file names to prevent path traversal and malicious extensions
    """
    
    ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    BLOCKED_PATTERNS = ['../', '..\\', '~/', '/etc/', '/var/', 'c:\\']
    
    @classmethod
    def validate(cls, filename: str) -> str:
        """
        Validate filename
        
        Args:
            filename: Filename to validate
            
        Returns:
            Sanitized filename
            
        Raises:
            ValidationError: If filename is dangerous
        """
        if not filename or not isinstance(filename, str):
            raise serializers.ValidationError("Filename must be a non-empty string")
        
        # Check for path traversal
        for pattern in cls.BLOCKED_PATTERNS:
            if pattern in filename.lower():
                raise serializers.ValidationError("Path traversal detected in filename")
        
        # Check extension
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Invalid file extension. Allowed: {', '.join(cls.ALLOWED_EXTENSIONS)}"
            )
        
        # Remove special characters except . - _
        sanitized = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
        
        return sanitized


class MongoDBQueryValidator:
    """
    Validate MongoDB queries to prevent NoSQL injection
    """
    
    DANGEROUS_OPERATORS = [
        '$where', '$regex', '$expr', '$function',
        '$accumulator', '$addFields', '$bucket',
        '$facet', '$graphLookup', '$lookup',
    ]
    
    @classmethod
    def validate_query(cls, query: dict) -> dict:
        """
        Validate MongoDB query dict
        
        Args:
            query: Query dictionary
            
        Returns:
            Validated query
            
        Raises:
            ValidationError: If query contains dangerous operators
        """
        if not isinstance(query, dict):
            return query
        
        cls._check_dict(query)
        return query
    
    @classmethod
    def _check_dict(cls, data: dict):
        """Recursively check dictionary for dangerous operators"""
        for key, value in data.items():
            # Check if key is a dangerous operator
            if isinstance(key, str) and key in cls.DANGEROUS_OPERATORS:
                raise serializers.ValidationError(
                    f"Dangerous MongoDB operator not allowed: {key}"
                )
            
            # Recursively check nested dicts
            if isinstance(value, dict):
                cls._check_dict(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        cls._check_dict(item)
