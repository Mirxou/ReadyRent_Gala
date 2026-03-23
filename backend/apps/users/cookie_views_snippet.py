
class CookieTokenRefreshView(SovereignResponseMixin, generics.GenericAPIView):
    """
    Refresh access token using HttpOnly cookie.
    Reads 'refresh_token' from cookie, validates it, and sets new cookies.
    """
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle] # Re-use login throttle
    serializer_class = None # No body serializer needed

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        
        if not refresh_token:
            return Response(
                {'error': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(refresh_token)
            
            # Rotate Token
            data = {'refresh': str(refresh)}
            
            # Generates new access token
            # Note: SimpleJWT RefreshToken object can generate access_token property
            new_access_token = str(refresh.access_token)
            
            # If rotation is enabled, we should blacklist the old one and get a new refresh token
            if settings.SIMPLE_JWT['ROTATE_REFRESH_TOKENS']:
                if settings.SIMPLE_JWT['BLACKLIST_AFTER_ROTATION']:
                    try:
                        refresh.blacklist()
                    except AttributeError:
                        pass # Blacklist app might not be installed

                refresh.set_jti()
                refresh.set_exp()
                refresh.set_iat()
                new_refresh_token = str(refresh)
            else:
                new_refresh_token = refresh_token

            response = Response({
                'status': 'refreshed',
                'dignity_preserved': True
            })

            # Set Access Token Cookie
            response.set_cookie(
                settings.AUTH_COOKIE_ACCESS,
                new_access_token,
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE,
                path=settings.AUTH_COOKIE_PATH
            )
            
            # Set Refresh Token Cookie (if rotated)
            if settings.SIMPLE_JWT['ROTATE_REFRESH_TOKENS']:
                response.set_cookie(
                    settings.AUTH_COOKIE_REFRESH,
                    new_refresh_token,
                    max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                    secure=settings.AUTH_COOKIE_SECURE,
                    httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                    samesite=settings.AUTH_COOKIE_SAMESITE,
                    path=settings.AUTH_REFRESH_COOKIE_PATH
                )

            return response
            
        except Exception as e:
            # If refresh fails, clear cookies
            response = Response(
                {'error': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie(settings.AUTH_COOKIE_ACCESS)
            response.delete_cookie(settings.AUTH_COOKIE_REFRESH, path=settings.AUTH_REFRESH_COOKIE_PATH)
            return response


class LogoutView(SovereignResponseMixin, generics.GenericAPIView):
    """
    Logout user by blacklisting refresh token and clearing cookies.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
            if refresh_token:
                token = RefreshToken(refresh_token)
                try:
                    token.blacklist()
                except AttributeError:
                    pass
        except Exception:
            pass # Invalid token, just clear cookies

        response = Response({
            'status': 'logged_out',
            'message': 'Logged out successfully',
            'dignity_preserved': True
        })

        response.delete_cookie(settings.AUTH_COOKIE_ACCESS)
        response.delete_cookie(settings.AUTH_COOKIE_REFRESH, path=settings.AUTH_REFRESH_COOKIE_PATH)
        
        return response
