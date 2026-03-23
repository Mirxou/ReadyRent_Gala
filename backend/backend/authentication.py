from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CookieJWTAuthentication(JWTAuthentication):
    """
    Investor-Grade Authentication: Reads JWT from HttpOnly Cookie.
    This removes the need for 'Authorization: Bearer' headers, mitigating XSS risks.
    """
    def authenticate(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS) or None
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except Exception:
             # Fail silently to allow other auth classes or return 401 later
            return None

        return self.get_user(validated_token), validated_token
