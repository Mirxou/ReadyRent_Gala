from decimal import Decimal
from datetime import timedelta

from django.utils import timezone

from .models import SettlementOffer
from .services.mediation_service import MediationService as _MediationService
from .services.precedent_search_service import PrecedentSearchService


class MediationService:
    @staticmethod
    def start_mediation(dispute):
        session = _MediationService.start_mediation(dispute)
        session.offers.filter(source='system').delete()
        _MediationService.generate_system_proposal(session)
        session.refresh_from_db()
        return session

    @staticmethod
    def generate_system_offer(session):
        dispute = session.dispute
        booking = dispute.booking
        if not booking:
            return None

        query_text = f"{dispute.title} {dispute.description}"
        search_fn = getattr(PrecedentSearchService, 'search', None) or getattr(PrecedentSearchService, 'find_similar_by_text')
        similar_cases = search_fn(query_text, top_k=5, min_similarity=0.60)

        ratios = []
        for case in similar_cases or []:
            if not isinstance(case, dict):
                continue
            ratio = case.get('awarded_ratio')
            if ratio is None:
                ratio = case.get('similarity_score')
            if ratio is not None:
                ratios.append(Decimal(str(ratio)))

        if ratios:
            avg_ratio = sum(ratios) / Decimal(len(ratios))
        else:
            avg_ratio = Decimal('0.5')

        base = dispute.claimed_amount or booking.total_price
        amount = (Decimal(str(base)) * avg_ratio).quantize(Decimal('0.01'))
        status = SettlementOffer.Status.PENDING_REVIEW if amount > Decimal('5000.00') else SettlementOffer.Status.VISIBLE

        return SettlementOffer.objects.create(
            session=session,
            source='system',
            amount=amount,
            reasoning='Legacy mediation proposal',
            is_accepted=False,
            status=status,
        )

    @staticmethod
    def generate_system_proposal(session):
        return MediationService.generate_system_offer(session)

    @staticmethod
    def accept_offer(offer):
        return _MediationService.accept_offer(offer)

    @staticmethod
    def reject_offer(offer):
        return _MediationService.reject_offer(offer)
