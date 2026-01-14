"""
Custom throttling classes for API rate limiting
"""
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, ScopedRateThrottle


class AnonymousUserThrottle(AnonRateThrottle):
    """
    Throttle for anonymous users.
    Rate: 100 requests per hour
    """
    rate = '100/hour'
    scope = 'anon'


class AuthenticatedUserThrottle(UserRateThrottle):
    """
    Throttle for authenticated users.
    Rate: 1000 requests per hour
    """
    rate = '1000/hour'
    scope = 'authenticated'


class LoginRateThrottle(AnonRateThrottle):
    """
    Throttle for login endpoint to prevent brute force attacks.
    Rate: 5 requests per minute
    """
    rate = '5/minute'
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    """
    Throttle for registration endpoint to prevent abuse.
    Rate: 5 requests per minute
    """
    rate = '5/minute'
    scope = 'register'


class ProductSearchThrottle(AnonRateThrottle):
    """
    Throttle for product search endpoint.
    Rate: 30 requests per minute for anonymous users
    """
    rate = '30/minute'
    scope = 'product_search'


class ChatbotThrottle(UserRateThrottle):
    """
    Throttle for chatbot endpoints.
    Rate: 20 requests per minute
    """
    rate = '20/minute'
    scope = 'chatbot'

