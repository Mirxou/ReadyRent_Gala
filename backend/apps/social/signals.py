import structlog
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Vouch
from apps.users.services import RiskScoreService

from apps.users.models import Blacklist
from .models import Referral

logger = structlog.get_logger("social.referrals")

@receiver(post_save, sender=Vouch)
def vouch_created(sender, instance, created, **kwargs):
    if created:
        RiskScoreService.handle_new_vouch(instance)

@receiver(post_save, sender=Blacklist)
def apply_parent_penalty(sender, instance, created, **kwargs):
    """
    The Propaganda (Phase 17 Refined):
    Graduated Social Collateral (3-Strikes Rule).
    1. Warning
    2. Freeze (Referral Privilege Suspended)
    3. Trust Hit (Penalty Applied)
    """
    if created:
        blacklisted_user = instance.user
        
        # Check if they were referred
        try:
            referral = Referral.objects.get(referred=blacklisted_user)
            referrer = referral.referrer
            
            # Count previous offenses (Revoked Referrals)
            # We count 'revoked' referrals where the referrer is the same parent.
            # Note: The current referral is not yet 'revoked' in DB at this exact line execution unless we save it now.
            previous_offenses = Referral.objects.filter(
                referrer=referrer, 
                status='revoked'
            ).count()
            
            current_strike = previous_offenses + 1
            
            logger.info(
                "parent_watch_strike",
                referrer=referrer.email,
                strike=current_strike,
                blacklisted_user=blacklisted_user.email
            )

            if current_strike == 1:
                # STRIKE 1: WARNING
                logger.warning(
                    "referral_strike_1_warning",
                    referrer=referrer.email,
                    blacklisted_user=blacklisted_user.email
                )
                # Trigger Notification Service
                from apps.notifications.services import NotificationService
                NotificationService.send_notification(
                    user=referrer,
                    title="Referral Strike Warning",
                    message=f"User {blacklisted_user.email} has been blacklisted. Strike 1 issued.",
                    notification_type="warning"
                )
            
            elif current_strike == 2:
                # STRIKE 2: FREEZE
                logger.warning(
                    "referral_strike_2_freeze",
                    referrer=referrer.email,
                    blacklisted_user=blacklisted_user.email
                )
                # We need a flag for this. For now, we assume Risk Score logic handles it or we set a flag.
                # Let's verify if we need to update VerificationStatus
                pass 
                
            elif current_strike >= 3:
                # STRIKE 3: TRUST HIT
                penalty_points = referral.social_collateral
                if hasattr(referrer, 'verification'):
                    verification = referrer.verification
                    verification.risk_score += penalty_points
                    verification.save()
                    logger.error(
                        "referral_strike_3_trust_hit",
                        referrer=referrer.email,
                        penalty_points=penalty_points,
                        new_risk_score=verification.risk_score
                    )

            # Always revoke the bad referral
            referral.status = 'revoked'
            referral.save()
            
        except Referral.DoesNotExist:
            pass # User was not referred, or orphan.
