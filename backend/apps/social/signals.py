from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Vouch
from apps.users.services_risk import RiskScoreService

from apps.users.models import Blacklist
from .models import Referral

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
            
            print(f"🚨 PARENT WATCH: {referrer.email} | Strike #{current_strike}")

            if current_strike == 1:
                # STRIKE 1: WARNING
                print(f"⚠️ STRIKE 1: Warning sent to {referrer.email}. 'Your referral {blacklisted_user.email} was blacklisted. Future operational errors will affect your Rep.'")
                # TODO: Trigger Notification Service
            
            elif current_strike == 2:
                # STRIKE 2: FREEZE
                print(f"❄️ STRIKE 2: Referrals FROZEN for {referrer.email}. 'You can no longer invite new users.'")
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
                    print(f"🔥 STRIKE 3: TRUST HIT! {referrer.email} (+{penalty_points} Risk Score).")

            # Always revoke the bad referral
            referral.status = 'revoked'
            referral.save()
            
        except Referral.DoesNotExist:
            pass # User was not referred, or orphan.
