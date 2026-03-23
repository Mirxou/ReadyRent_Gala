from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from inspect import signature as _mutmut_signature
from typing import Annotated
from typing import Callable
from typing import ClassVar


MutantDict = Annotated[dict[str, Callable], "Mutant"]


def _mutmut_trampoline(orig, mutants, call_args, call_kwargs, self_arg = None):
    """Forward call to original or mutated function, depending on the environment"""
    import os
    mutant_under_test = os.environ['MUTANT_UNDER_TEST']
    if mutant_under_test == 'fail':
        from mutmut.__main__ import MutmutProgrammaticFailException
        raise MutmutProgrammaticFailException('Failed programmatically')      
    elif mutant_under_test == 'stats':
        from mutmut.__main__ import record_trampoline_hit
        record_trampoline_hit(orig.__module__ + '.' + orig.__name__)
        result = orig(*call_args, **call_kwargs)
        return result
    prefix = orig.__module__ + '.' + orig.__name__ + '__mutmut_'
    if not mutant_under_test.startswith(prefix):
        result = orig(*call_args, **call_kwargs)
        return result
    mutant_name = mutant_under_test.rpartition('.')[-1]
    if self_arg is not None:
        # call to a class method where self is not bound
        result = mutants[mutant_name](self_arg, *call_args, **call_kwargs)
    else:
        result = mutants[mutant_name](*call_args, **call_kwargs)
    return result

class CookieJWTAuthentication(JWTAuthentication):
    """
    Investor-Grade Authentication: Reads JWT from HttpOnly Cookie.
    This removes the need for 'Authorization: Bearer' headers, mitigating XSS risks.
    """
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_orig(self, request):
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
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_1(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = None
        
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
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_2(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(None)
        
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
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_3(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is not None:
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
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_4(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is None:
            raw_token = None
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
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_5(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS) and None
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
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_6(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(None) or None
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
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_7(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS) or None
        else:
            raw_token = None

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except Exception:
             # Fail silently to allow other auth classes or return 401 later
            return None

        return self.get_user(validated_token), validated_token
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_8(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS) or None
        else:
            raw_token = self.get_raw_token(None)

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except Exception:
             # Fail silently to allow other auth classes or return 401 later
            return None

        return self.get_user(validated_token), validated_token
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_9(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS) or None
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is not None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except Exception:
             # Fail silently to allow other auth classes or return 401 later
            return None

        return self.get_user(validated_token), validated_token
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_10(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS) or None
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            validated_token = None
        except Exception:
             # Fail silently to allow other auth classes or return 401 later
            return None

        return self.get_user(validated_token), validated_token
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_11(self, request):
        # 1. Try to get token from Cookie (Primary Secure Method)
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS) or None
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(None)
        except Exception:
             # Fail silently to allow other auth classes or return 401 later
            return None

        return self.get_user(validated_token), validated_token
    def xǁCookieJWTAuthenticationǁauthenticate__mutmut_12(self, request):
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

        return self.get_user(None), validated_token
    
    xǁCookieJWTAuthenticationǁauthenticate__mutmut_mutants : ClassVar[MutantDict] = {
    'xǁCookieJWTAuthenticationǁauthenticate__mutmut_1': xǁCookieJWTAuthenticationǁauthenticate__mutmut_1, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_2': xǁCookieJWTAuthenticationǁauthenticate__mutmut_2, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_3': xǁCookieJWTAuthenticationǁauthenticate__mutmut_3, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_4': xǁCookieJWTAuthenticationǁauthenticate__mutmut_4, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_5': xǁCookieJWTAuthenticationǁauthenticate__mutmut_5, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_6': xǁCookieJWTAuthenticationǁauthenticate__mutmut_6, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_7': xǁCookieJWTAuthenticationǁauthenticate__mutmut_7, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_8': xǁCookieJWTAuthenticationǁauthenticate__mutmut_8, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_9': xǁCookieJWTAuthenticationǁauthenticate__mutmut_9, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_10': xǁCookieJWTAuthenticationǁauthenticate__mutmut_10, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_11': xǁCookieJWTAuthenticationǁauthenticate__mutmut_11, 
        'xǁCookieJWTAuthenticationǁauthenticate__mutmut_12': xǁCookieJWTAuthenticationǁauthenticate__mutmut_12
    }
    
    def authenticate(self, *args, **kwargs):
        result = _mutmut_trampoline(object.__getattribute__(self, "xǁCookieJWTAuthenticationǁauthenticate__mutmut_orig"), object.__getattribute__(self, "xǁCookieJWTAuthenticationǁauthenticate__mutmut_mutants"), args, kwargs, self)
        return result 
    
    authenticate.__signature__ = _mutmut_signature(xǁCookieJWTAuthenticationǁauthenticate__mutmut_orig)
    xǁCookieJWTAuthenticationǁauthenticate__mutmut_orig.__name__ = 'xǁCookieJWTAuthenticationǁauthenticate'
