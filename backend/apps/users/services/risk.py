from django.db.models import F
from ..models import User, VerificationStatus, Blacklist


class RiskScoreService:
    """
    Service to calculate User Risk Score.
    Scale: 0 (Safe) to 100 (High Risk).
    """

    @staticmethod
    def calculate_score(user):
        """
        Calculate risk score based on profile, verification, and history.
        """
        score = 50  # Base risk for new users
        
        # 1. Verification Status (Major Impact)
        try:
            vs = user.verification
            if vs.status == 'verified':
                score -= 30
            elif vs.status == 'rejected':
                score += 20
            
            if vs.phone_verified:
                score -= 10
                
            # If currently blacklisted (Active Ban), max risk
            # Check DB directly for safety
            if Blacklist.objects.filter(user=user, is_active=True).exists():
                return 100
            
            # Legacy check just in case
            if vs.is_blacklisted:
                return 100
                
        except VerificationStatus.DoesNotExist:
            # No verification record implies unverified
            pass

        # 2. Profile Completeness (Minor Impact)
        if hasattr(user, 'profile'):
            profile = user.profile
            # Has Avatar?
            if user.avatar:
                score -= 5
            # Has Full Name?
            if user.first_name and user.last_name:
                score -= 5
                
        # 3. History (Blacklist Checks)
        previous_bans = Blacklist.objects.filter(user=user, is_active=False).count()
        if previous_bans > 0:
            score += (previous_bans * 15)

        # 4. Activity (Bookings Trust)
        # Import inside method to avoid circular dependency
        from apps.bookings.models import Booking
        completed_bookings = Booking.objects.filter(user=user, status='completed').count()
        # Each completed booking reduces risk by 2 points, max 20 points
        trust_bonus = min(20, completed_bookings * 2)
        score -= trust_bonus

        # 5. Social Vouching (Web of Trust 2.0)
        # Transitive Trust: Impact = TrustLevel * VoucherCredibility
        from apps.social.models import Vouch
        vouches = Vouch.objects.filter(receiver=user).select_related('voucher__verification')
        
        total_trust_impact = 0
        for vouch in vouches:
            # 1. Voucher Credibility (0.0 to 1.0)
            # Low risk user = High credibility.
            voucher_risk = getattr(vouch.voucher.verification, 'risk_score', 50)
            
            # Constraint: Only trusted users (Risk < 50) provide positive impact
            if voucher_risk >= 50:
                continue

            credibility = (100 - voucher_risk) / 100.0  # e.g., Risk 10 -> 0.9
            
            # 2. Trust Level (1 to 5)
            # Level 5 (Relative) * 0.9 * 10 (System Constant) = 45 points reduction
            impact = vouch.trust_level * credibility * 10
            total_trust_impact += impact

        # Cap max reduction to avoid gaming (Max 60 points)
        score -= min(60, int(total_trust_impact))

        # 5. Clamp score between 0 and 100
        return max(0, min(100, score))

    @staticmethod
    def update_user_risk_score(user):
        """
        Calculate and save the new risk score and trust score.
        """
        new_risk_score = RiskScoreService.calculate_score(user)
        
        # 🛡️ SOVEREIGN UNIFICATION: Convert Risk (0=Safe, 100=Danger) to Trust (100=Safe, 0=Danger)
        new_trust_score = 100 - new_risk_score

        # 1. Update Legacy VerificationStatus
        # Only update existing verification rows.
        # KYC/KYB flows create the record explicitly; signals must not implicitly
        # create a one-to-one row because that collides with manual submissions.
        VerificationStatus.objects.filter(user=user).update(risk_score=new_risk_score)

        # 2. Update Sovereign User model (The "Crown Authority" source)
        user.trust_score = new_trust_score
        user.save(update_fields=['trust_score'])
        
        return new_risk_score

    @staticmethod
    def handle_new_vouch(vouch_instance):
        """
        Triggered when a new vouch is created.
        Updates the receiver's risk score immediately.
        """
        RiskScoreService.update_user_risk_score(vouch_instance.receiver)
