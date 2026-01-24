import logging
import time
from typing import Dict, Any
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
import hashlib
import json

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware:
    """
    Add comprehensive security headers to all responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Security Headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # HSTS (HTTP Strict Transport Security)
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://js.stripe.com https://fonts.googleapis.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://api.stripe.com wss:",
            "frame-src https://js.stripe.com",
            "object-src 'none'",
            "base-uri 'self'"
        ]
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        return response


class RateLimitMiddleware:
    """
    Implement rate limiting to prevent abuse
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limits = {
            '/api/auth/login/': {'requests': 5, 'window': 300},  # 5 attempts per 5 minutes
            '/api/auth/register/': {'requests': 3, 'window': 3600},  # 3 attempts per hour
            '/api/loans/apply/': {'requests': 5, 'window': 3600},  # 5 loan apps per hour
            '/api/payments/': {'requests': 50, 'window': 3600},  # 50 payment requests per hour
            'default': {'requests': 100, 'window': 3600}  # Default: 100 requests per hour
        }
        # Endpoints exempt from rate limiting (health checks, etc.)
        self.exempt_paths = [
            '/api/health/',
            '/api/ready/',
        ]

    def __call__(self, request):
        # Skip rate limiting for exempt paths (health checks)
        if any(request.path.startswith(path) for path in self.exempt_paths):
            return self.get_response(request)

        if self._is_rate_limited(request):
            return JsonResponse(
                {'error': 'Rate limit exceeded. Please try again later.'},
                status=429
            )

        return self.get_response(request)

    def _is_rate_limited(self, request: HttpRequest) -> bool:
        """Check if request should be rate limited"""
        client_ip = self._get_client_ip(request)
        path = request.path
        
        # Get rate limit config for this path
        rate_config = self.rate_limits.get(path, self.rate_limits['default'])
        
        # Create cache key
        cache_key = f"rate_limit:{client_ip}:{path}"
        
        # Get current request count
        request_count = cache.get(cache_key, 0)
        
        if request_count >= rate_config['requests']:
            logger.warning(f"Rate limit exceeded for {client_ip} on {path}")
            return True
        
        # Increment counter
        cache.set(cache_key, request_count + 1, rate_config['window'])
        return False

    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AuditLogMiddleware:
    """
    Log security-relevant events and suspicious activities
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.sensitive_endpoints = [
            '/api/auth/',
            '/api/loans/',
            '/api/payments/',
            '/api/documents/',
            '/api/kyc/'
        ]

    def __call__(self, request):
        start_time = time.time()
        response = self.get_response(request)
        end_time = time.time()
        
        # Log security events
        if self._should_log(request):
            self._log_request(request, response, end_time - start_time)
        
        return response

    def _should_log(self, request: HttpRequest) -> bool:
        """Determine if request should be logged"""
        path = request.path
        return any(endpoint in path for endpoint in self.sensitive_endpoints)

    def _log_request(self, request: HttpRequest, response: HttpResponse, duration: float):
        """Log request details"""
        user_id = getattr(request.user, 'id', None) if hasattr(request, 'user') else None
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'method': request.method,
            'path': request.path,
            'user_id': str(user_id) if user_id else None,
            'ip_address': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'content_length': len(response.content) if hasattr(response, 'content') else 0
        }
        
        # Log failed authentication attempts
        if request.path.endswith('/login/') and response.status_code >= 400:
            log_data['event_type'] = 'failed_login'
            logger.warning(f"Failed login attempt: {json.dumps(log_data)}")
        
        # Log successful authentication
        elif request.path.endswith('/login/') and response.status_code == 200:
            log_data['event_type'] = 'successful_login'
            logger.info(f"Successful login: {json.dumps(log_data)}")
        
        # Log other security events
        else:
            logger.info(f"API request: {json.dumps(log_data)}")

    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class MHCCIntegrationMiddleware:
    """
    Integration with MHCC (cybersecurity partner) for threat monitoring
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.mhcc_enabled = getattr(settings, 'MHCC_MONITORING_ENABLED', True)
        self.threat_indicators = [
            'sqlmap',
            'nmap',
            'burpsuite',
            'nikto',
            'union select',
            '<script>',
            'javascript:',
            '../../../etc/passwd'
        ]

    def __call__(self, request):
        # Pre-request threat detection
        if self.mhcc_enabled and self._detect_threats(request):
            self._report_threat(request)
            return JsonResponse(
                {'error': 'Request blocked for security reasons'},
                status=403
            )
        
        response = self.get_response(request)
        
        # Post-request monitoring
        if self.mhcc_enabled:
            self._monitor_response(request, response)
        
        return response

    def _detect_threats(self, request: HttpRequest) -> bool:
        """Detect potential security threats in request"""
        request_data = {
            'query_string': request.META.get('QUERY_STRING', ''),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'path': request.path,
            'body': getattr(request, 'body', b'').decode('utf-8', errors='ignore')
        }
        
        # Check for threat indicators
        for indicator in self.threat_indicators:
            for field, value in request_data.items():
                if indicator.lower() in value.lower():
                    logger.critical(f"Threat detected in {field}: {indicator}")
                    return True
        
        return False

    def _report_threat(self, request: HttpRequest):
        """Report threat to MHCC monitoring system"""
        threat_data = {
            'timestamp': timezone.now().isoformat(),
            'ip_address': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'path': request.path,
            'method': request.method,
            'threat_type': 'suspicious_request',
            'severity': 'high'
        }
        
        # In a real implementation, this would send data to MHCC API
        logger.critical(f"MHCC Threat Report: {json.dumps(threat_data)}")
        
        # Cache threat IP for future blocking
        ip = self._get_client_ip(request)
        cache.set(f"blocked_ip:{ip}", True, 3600)  # Block for 1 hour

    def _monitor_response(self, request: HttpRequest, response: HttpResponse):
        """Monitor response for data leakage"""
        if response.status_code >= 500:
            # Log server errors for investigation
            logger.error(f"Server error detected: {request.path} - Status: {response.status_code}")

    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip