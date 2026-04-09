"""
Abuse Pattern Detection Service for Phase 23, Step 5

Internal tools for detecting and tracking abuse patterns.
Admin-only, privacy-preserving.

Sovereign Safeguard: Reputation tracking does NOT influence judgment outcomes.
"""
from typing import Dict, List, Optional
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Q, Avg, F
from django.utils import timezone
from django.contrib.auth import get_user_model

from ..models import (
    Dispute,
    Judgment,
    UserReputationLog,
    AnonymizedJudgment
)

User = get_user_model()


class AbuseDetector:
    """
    Detect abuse patterns for internal monitoring.
    
    CRITICAL: This is ONLY for admin visibility.
    Patterns detected here do NOT affect judgment outcomes.
    """
    
    # Thresholds
    SERIAL_FILER_THRESHOLD = 5  # 5+ disputes in 30 days
    GAMING_WIN_RATE_THRESHOLD = 0.90  # 90%+ win rate suspicious
    MINIMUM_DISPUTES_FOR_PATTERN = 3
    
    @staticmethod
    def detect_serial_filers(days: int = 30) -> List[Dict]:
        """
        Identify users filing excessive disputes.
        
        Pattern: 5+ disputes in 30 days.
        
        Returns list of users with dispute counts and categories.
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Count disputes per user
        serial_filers = Dispute.objects.filter(
            created_at__gte=cutoff_date
        ).values(
            'user'
        ).annotate(
            dispute_count=Count('id')
        ).filter(
            dispute_count__gte=AbuseDetector.SERIAL_FILER_THRESHOLD
        ).order_by('-dispute_count')
        
        results = []
        for filer in serial_filers:
            user = User.objects.get(id=filer['user'])
            
            # Get verdict distribution
            user_disputes = Dispute.objects.filter(
                user=user,
                created_at__gte=cutoff_date
            ).filter(judgment__isnull=False)
            
            total_judged = user_disputes.count()
            if total_judged == 0:
                continue
            
            # Count verdicts
            won = 0
            for dispute in user_disputes.select_related('booking__product__owner', 'booking__user', 'judgment'):
                verdict = Judgment.canonical_verdict(dispute.judgment.verdict)
                if dispute.booking and verdict == 'favor_owner' and dispute.booking.product and dispute.booking.product.owner == user:
                    won += 1
                elif dispute.booking and verdict == 'favor_tenant' and dispute.booking.user == user:
                    won += 1
            
            win_rate = (won / total_judged) if total_judged > 0 else 0
            
            # Log for tracking
            UserReputationLog.objects.create(
                user=user,
                event_type='PATTERN_DETECTED',
                event_data={
                    'pattern': 'serial_filer',
                    'dispute_count': filer['dispute_count'],
                    'win_rate': float(win_rate),
                    'period_days': days
                },
                context=f"Filed {filer['dispute_count']} disputes in {days} days"
            )
            
            results.append({
                'user_id': user.id,
                'user_email': user.email,
                'dispute_count': filer['dispute_count'],
                'win_rate': round(win_rate * 100, 1),
                'risk_level': 'HIGH' if filer['dispute_count'] > 10 else 'MEDIUM'
            })
        
        return results
    
    @staticmethod
    def detect_gaming_attempts(days: int = 90) -> List[Dict]:
        """
        Identify suspicious win rate patterns.
        
        Pattern: 90%+ win rate with 3+ disputes.
        Could indicate evidence fabrication or system gaming.
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Get users with judgments
        judged_disputes = Judgment.objects.filter(
            created_at__gte=cutoff_date
        ).values('dispute__user').annotate(
            total=Count('id')
        ).filter(
            total__gte=AbuseDetector.MINIMUM_DISPUTES_FOR_PATTERN
        )
        
        suspicious_users = []
        
        for item in judged_disputes:
            user = User.objects.get(id=item['dispute__user'])
            
            # Calculate win rate
            user_judgments = Judgment.objects.filter(
                dispute__user=user,
                created_at__gte=cutoff_date
            )
            
            total = user_judgments.count()
            
            # Count wins (need to check if user is owner or renter)
            won = 0
            for judgment in user_judgments:
                dispute = judgment.dispute
                verdict = Judgment.canonical_verdict(judgment.verdict)
                if dispute.booking and dispute.booking.product.owner == user and verdict == 'favor_owner':
                    won += 1
                elif dispute.booking and dispute.booking.user == user and verdict == 'favor_tenant':
                    won += 1
            
            win_rate = (won / total) if total > 0 else 0
            
            if win_rate >= AbuseDetector.GAMING_WIN_RATE_THRESHOLD:
                # Log suspicious pattern
                UserReputationLog.objects.create(
                    user=user,
                    event_type='PATTERN_DETECTED',
                    event_data={
                        'pattern': 'high_win_rate',
                        'win_rate': float(win_rate),
                        'total_disputes': total,
                        'period_days': days
                    },
                    context=f"Win rate: {win_rate*100:.1f}% over {total} disputes"
                )
                
                suspicious_users.append({
                    'user_id': user.id,
                    'user_email': user.email,
                    'total_disputes': total,
                    'won_disputes': won,
                    'win_rate': round(win_rate * 100, 1),
                    'risk_level': 'HIGH' if win_rate > 0.95 else 'MEDIUM'
                })
        
        return suspicious_users
    
    @staticmethod
    def detect_category_concentration(days: int = 90) -> List[Dict]:
        """
        Identify users filing disputes in only one category repeatedly.
        
        Could indicate targeted abuse or specialized scam.
        """
        # Note: Dispute model doesn't have category field
        # This detection is simplified for MVP
        # Could be enhanced by looking at booking__product__category
        
        concentrated = []
        return concentrated  # Stub for now
    
    @staticmethod
    def get_user_abuse_summary(user_id: int) -> Dict:
        """
        Get comprehensive abuse summary for a single user.
        
        For admin review.
        """
        user = User.objects.get(id=user_id)
        
        # Get all reputation logs
        logs = UserReputationLog.objects.filter(user=user).order_by('-timestamp')
        
        # Categorize
        patterns = logs.filter(event_type='PATTERN_DETECTED')
        warnings = logs.filter(event_type='WARNING_ISSUED')
        
        # Get dispute stats
        total_disputes = Dispute.objects.filter(user=user).count()
        judged_disputes = Judgment.objects.filter(dispute__user=user).count()
        
        return {
            'user_id': user.id,
            'user_email': user.email,
            'total_disputes': total_disputes,
            'judged_disputes': judged_disputes,
            'patterns_detected': patterns.count(),
            'warnings_issued': warnings.count(),
            'recent_logs': [
                {
                    'timestamp': log.timestamp,
                    'event_type': log.event_type,
                    'context': log.context,
                    'data': log.event_data
                }
                for log in logs[:10]
            ]
        }
