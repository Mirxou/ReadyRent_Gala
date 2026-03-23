from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import User
from core.image_optimization import ImageOptimizationService

@receiver(pre_save, sender=User)
def optimize_user_avatar(sender, instance, **kwargs):
    """
    Sanitize and optimize user avatars.
    Firewall Protection:
    1. EXIF Stripping
    2. Resize to 500x500 (Avatar standard)
    3. Safe Format
    """
    if instance.avatar:
        # Check if new image
        if not instance.pk:
            is_new = True
        else:
            try:
                old = User.objects.get(pk=instance.pk)
                is_new = old.avatar != instance.avatar
            except User.DoesNotExist:
                is_new = True

        if is_new:
            # Avatars can be smaller
            optimized = ImageOptimizationService.optimize_image(
                instance.avatar,
                max_size=(500, 500),
                quality=80
            )
            instance.avatar = optimized


from django.db.models.signals import post_save
from .models import UserProfile, VerificationStatus, Blacklist
from .services_risk import RiskScoreService

@receiver(post_save, sender=User)
def trigger_risk_check_user(sender, instance, created, **kwargs):
    if not created:  # Avoid double save on create
        RiskScoreService.update_user_risk_score(instance)

@receiver(post_save, sender=UserProfile)
def trigger_risk_check_profile(sender, instance, **kwargs):
    RiskScoreService.update_user_risk_score(instance.user)

@receiver(post_save, sender=VerificationStatus)
def trigger_risk_check_verification(sender, instance, **kwargs):
    # Avoid recursion if this save was triggered by the service itself
    # We can check if specific fields changed, but for now we rely on the fact 
    # that update_user_risk_score uses update_or_create which might trigger save again.
    # To prevent infinite loop, we should check if risk_score is the only thing changing?
    # Or better, the service uses update() on queryset if possible, but here we used update_or_create.
    # Simple recursion protection:
    pass 
    # Actually, VerificationStatus contains the risk_score. 
    # If we update it inside the signal of the same model, we get a loop.
    # We need to act carefully here. 
    
    # Let's NOT trigger from VerificationStatus save if the change was just risk_score.
    # But for simplicity in this iteration, let's trigger ONLY on other models
    # OR move the risk update logic to NOT save the entire model instance if possible.
    
    # Revised approach:
    # We won't listen to VerificationStatus post_save to avoid loops since the score is stored there.
    # The score depends on status/flags in VerificationStatus though.
    # So we DO need to listen to it, but skip if we are just updating the score.
    
    # BETTER: We call the service manually where VerificationStatus logic changes (e.g. views/serializers),
    # OR we check if 'risk_score' is in update_fields? (Not reliable if save() called without args).
    
    # Safest for now: Calculate risk when User/Profile/Blacklist changes.
    # For VerificationStatus, we assume the specific workflow modifying it will handle re-calc 
    # OR we use a separate method that doesn't trigger signals.
    pass

@receiver(post_save, sender=Blacklist)
def trigger_risk_check_blacklist(sender, instance, **kwargs):
    RiskScoreService.update_user_risk_score(instance.user)

