"""
Core Pagination Module

Defines strict pagination controls to prevent resource exhaustion attacks
and maintain predictable database querying characteristics globally.
"""
from rest_framework.pagination import PageNumberPagination  # type: ignore

class StrictPageNumberPagination(PageNumberPagination):
    """
    Sovereign Pagination Control.
    
    Enforces a strict maximum page size to defend against memory exhaustion 
    attacks (e.g., ?page_size=1000000) which can bypass standard Throttling.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50  # Hard limit on records per query
