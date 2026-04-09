"""
Custom throttling classes for API rate limiting
"""

from rest_framework.throttling import (
    UserRateThrottle,
    AnonRateThrottle,
    ScopedRateThrottle,
)


class RealIPRateThrottle(AnonRateThrottle):
    """
    Base Throttle that uses the Real IP address from X-Forwarded-For header.
    Essential for applications behind proxies (Load Balancers, Cloudflare, etc.)
    """

    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            return None  # Only throttle anonymous users

        # 🛡️ Sovereign Security: Get Real IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            # Taking the first IP in the list (Client IP)
            ident = x_forwarded_for.split(",")[0].strip()
        else:
            ident = request.META.get("REMOTE_ADDR")

        return self.cache_format % {"scope": self.scope, "ident": ident}


class AnonymousUserThrottle(RealIPRateThrottle):
    """
    Throttle for anonymous users.
    Rate: 100 requests per hour
    """

    rate = "100/hour"
    scope = "anon"


class AuthenticatedUserThrottle(UserRateThrottle):
    """
    Throttle for authenticated users.
    Rate: 1000 requests per hour
    """

    rate = "1000/hour"
    scope = "authenticated"


class LoginRateThrottle(RealIPRateThrottle):
    """
    Throttle for login endpoint to prevent brute force attacks.
    Rate: 5 requests per minute
    """

    rate = "5/minute"
    scope = "login"


class RegisterRateThrottle(RealIPRateThrottle):
    """
    Throttle for registration endpoint to prevent abuse.
    Rate: 5 requests per minute
    """

    rate = "5/minute"
    scope = "register"


class ProductSearchThrottle(RealIPRateThrottle):
    """
    Throttle for product search endpoint.
    Rate: 30 requests per minute for anonymous users
    """

    rate = "30/minute"
    scope = "product_search"


class ChatbotThrottle(UserRateThrottle):
    """
    Throttle for chatbot endpoints.
    Rate: 20 requests per minute
    """

    rate = "20/minute"
    scope = "chatbot"


class PaymentThrottle(UserRateThrottle):
    """
    Throttle for payment endpoints to prevent payment abuse.
    Rate: 10 requests per minute - strict for financial operations
    """

    rate = "10/minute"
    scope = "payment"


class PaymentVerificationThrottle(RealIPRateThrottle):
    """
    Throttle for payment OTP verification - very strict to prevent guessing.
    Rate: 5 requests per minute
    """

    rate = "5/minute"
    scope = "payment_verify"
