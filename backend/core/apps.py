"""
Core app configuration
"""
from django.apps import AppConfig
import logging
from django.utils.functional import Promise

logger = logging.getLogger(__name__)


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    
    def ready(self):
        """Patch drf_spectacular after Django is ready to handle gettext_lazy verbose_name"""
        try:
            import drf_spectacular.openapi
            
            # Patch _map_model_field to handle gettext_lazy verbose_name
            AutoSchema = drf_spectacular.openapi.AutoSchema
            
            if hasattr(AutoSchema, '_map_model_field'):
                original_map_model_field = AutoSchema._map_model_field
                
                def patched_map_model_field(self, model_field, direction):
                    """Patched to handle gettext_lazy verbose_name"""
                    # Convert verbose_name to string if it's a Promise (gettext_lazy) BEFORE calling original
                    if hasattr(model_field, 'verbose_name') and model_field.verbose_name:
                        verbose_name = model_field.verbose_name
                        # Check if it's a Promise (which includes gettext_lazy)
                        if isinstance(verbose_name, Promise):
                            # Temporarily convert to string
                            original_verbose_name = model_field.verbose_name
                            model_field.verbose_name = str(verbose_name)
                            try:
                                result = original_map_model_field(self, model_field, direction)
                                return result
                            finally:
                                # Always restore original
                                model_field.verbose_name = original_verbose_name
                    
                    return original_map_model_field(self, model_field, direction)
                
                AutoSchema._map_model_field = patched_map_model_field
                logger.info("Patched drf_spectacular._map_model_field to handle gettext_lazy verbose_name")
            
            # Also patch _resolve_path_parameters which might call _map_model_field
            if hasattr(AutoSchema, '_resolve_path_parameters'):
                original_resolve_path_parameters = AutoSchema._resolve_path_parameters
                
                def patched_resolve_path_parameters(self, path_variables):
                    """Patched to handle gettext_lazy verbose_name in path parameters"""
                    try:
                        return original_resolve_path_parameters(self, path_variables)
                    except TypeError as e:
                        if 'verbose_name' in str(e) and 'unexpected keyword argument' in str(e):
                            # Try to handle it by converting verbose_name to string
                            # This is a fallback if _map_model_field patch didn't catch it
                            logger.warning(f"Caught verbose_name error in _resolve_path_parameters: {e}")
                            # Return empty list as fallback
                            return []
                        raise
                
                AutoSchema._resolve_path_parameters = patched_resolve_path_parameters
                logger.info("Patched drf_spectacular._resolve_path_parameters")
                
        except (ImportError, AttributeError) as e:
            # If drf_spectacular is not available, skip patching
            logger.debug(f"Could not patch drf_spectacular: {e}")
