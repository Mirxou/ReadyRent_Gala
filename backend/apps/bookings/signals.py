from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Booking
from apps.users.services import RiskScoreService

@receiver(post_save, sender=Booking)
def trigger_risk_check_booking(sender, instance, **kwargs):
    """
    Update risk score when a booking is completed.
    This rewards active, good users.
    """
    if instance.status == 'completed':
        # Recalculate trust score for both parties? 
        # For now, just the renter (user). Owner trust is handled differently.
        RiskScoreService.update_user_risk_score(instance.user)
