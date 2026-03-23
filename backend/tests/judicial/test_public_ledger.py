import pytest
from django.urls import reverse
from rest_framework import status
from apps.disputes.models import Dispute, Judgment, AnonymizedJudgment, PublicMetrics, MetricContextCard
from apps.disputes.adjudication_service import AdjudicationService
from decimal import Decimal

@pytest.mark.django_db
def test_autonomization_on_finalization(admin_user, regular_user, product, booking):
    """
    Test that finalizing a judgment automatically creates an AnonymizedJudgment.
    """
    # 1. Setup Dispute and Judgment
    dispute = Dispute.objects.create(
        user=regular_user,
        booking=booking,
        title="Privacy Test Case",
        description="The secret details of this case should be hidden from the public.",
        status="judgment_provisional"
    )
    judgment = Judgment.objects.create(
        dispute=dispute,
        judge=admin_user,
        verdict="favor_owner",
        ruling_text="Owner is correct. Payment must be made.",
        awarded_amount=Decimal("100.00"),
        status="provisional"
    )

    # 2. Finalize Judgment
    AdjudicationService.finalize_judgment(judgment)

    # 3. Verify Anonymized Record exists
    assert AnonymizedJudgment.objects.count() == 1
    anon = AnonymizedJudgment.objects.first()
    
    # Check de-identification
    assert anon.verdict == "favor_owner"
    assert anon.dispute_type == "Privacy Test Case"
    assert anon.ruling_summary in judgment.ruling_text
    # Should be a valid SHA256 hash (64 chars)
    assert len(anon.judgment_hash) == 64
    # The hash should not be the judgment ID itself
    assert anon.judgment_hash != str(judgment.id)
    # Should have evidence types (empty for now since no logs created, but service extracts them)
    print(f"Anon record: {anon.judgment_hash}")


@pytest.mark.django_db
def test_public_api_access(client, admin_client, admin_user, regular_user, product, booking):
    """
    Test that Public Ledger and Metrics APIs are accessible without auth.
    """
    # 1. Seed some data
    anon = AnonymizedJudgment.objects.create(
        judgment_hash="xyz-789",
        category="General",
        dispute_type="Lease Conflict",
        ruling_summary="Resolved via mediation.",
        verdict="split",
        judgment_date="2026-02-01"
    )
    
    metric = PublicMetrics.objects.create(
        metric_type="verdict_balance",
        period_start="2026-02-01",
        period_end="2026-02-28",
        value_numeric=Decimal("75.50")
    )
    MetricContextCard.objects.create(
        metric=metric,
        context_explanation="High owner-favoring rate due to seasonality."
    )

    # 2. Access Ledger (Unauthenticated)
    url_ledger = reverse('public-ledger')
    response = client.get(url_ledger)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    print(f"DEBUG: Data type: {type(data)}")
    print(f"DEBUG: Data content: {data}")
    
    if isinstance(data, list):
        results = data
    else:
        results = data.get('results', data)
        
    assert len(results) > 0
    assert results[0]['judgment_hash'] == "xyz-789"

    # 3. Access Metrics (Unauthenticated)
    url_metrics = reverse('public-metrics')
    response = client.get(url_metrics)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    results = data.get('results', data)
    assert len(results) > 0
    assert results[0]['context'] == "High owner-favoring rate due to seasonality."
