"""
Custom middleware for security headers
"""
from django.utils.deprecation import MiddlewareMixin


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers according to OWASP recommendations
    """
    
    def process_response(self, request, response):
        # X-Frame-Options: Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # X-Content-Type-Options: Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # X-XSS-Protection: Enable XSS filter
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer-Policy: Control referrer information
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions-Policy: Control browser features
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=()'
        )
        
        # Content-Security-Policy: Prevent XSS attacks
        # Note: Adjust CSP based on your needs
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.googletagmanager.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' https://api.openai.com https://graph.facebook.com; "
            "frame-src 'self' https://www.google.com; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "upgrade-insecure-requests;"
        )
        response['Content-Security-Policy'] = csp
        
        # Strict-Transport-Security: Force HTTPS (only in production)
        if not request.get_host().startswith('localhost') and not request.get_host().startswith('127.0.0.1'):
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        return response

