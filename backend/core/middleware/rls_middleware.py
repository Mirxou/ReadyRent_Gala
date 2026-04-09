from django.db import connection

class RLSMiddleware:
    """
    Middleware to set the current user ID in the database session variable.
    This allows Row Level Security (RLS) policies in PostgreSQL/Supabase 
    to restrict access based on the 'app.current_user_id' setting.
    
    OPTIMIZED: Batches both SET commands in single query to reduce network RTT.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # GUARD: Only execute on PostgreSQL (prevents crashes in SQLite tests)
        if connection.vendor != 'postgresql':
            return self.get_response(request)

        # Set the user context before the view runs
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                user_id = int(request.user.id)
            except (ValueError, TypeError):
                # Invalid user ID - skip RLS setup
                return
            is_admin = 'true' if request.user.is_superuser else 'false'
            
            # OPTIMIZATION: Execute both SET commands in single roundtrip
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        set_config('app.current_user_id', %s, false),
                        set_config('app.current_user_is_admin', %s, false)
                """, [str(user_id), is_admin])
        else:
            # Clear for anonymous users - single query
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        set_config('app.current_user_id', '', false),
                        set_config('app.current_user_is_admin', 'false', false)
                """)

        response = self.get_response(request)
        return response
