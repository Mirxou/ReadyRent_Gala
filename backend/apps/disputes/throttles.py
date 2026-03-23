"""
Rate Limiting Throttles for Disputes App

Provides graceful rate limiting (not hostile) for public endpoints.
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class PublicMetricsThrottle(AnonRateThrottle):
    """
    Graceful rate limiting for public metrics endpoint
    
    Limits: 100 requests/hour for anonymous users
    
    This prevents abuse while allowing legitimate public access.
    Error message is friendly, not hostile.
    """
    rate = '100/hour'


class PrecedentSearchThrottle(UserRateThrottle):
    """
    Rate limiting for precedent search
    
    Limits: 50 searches/hour for authenticated users
    
    Embedding search is computationally expensive, so we limit
    to prevent resource exhaustion.
    """
    rate = '50/hour'


class PublicJudgmentLedgerThrottle(AnonRateThrottle):
    """
    Rate limiting for public judgment ledger
    
    Limits: 200 requests/hour for anonymous users
    
    More generous than metrics since ledger is read-only
    and typically paginated.
    """
    rate = '200/hour'
