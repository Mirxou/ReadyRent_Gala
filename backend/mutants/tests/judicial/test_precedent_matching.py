import pytest
from django.urls import reverse
from rest_framework import status
from apps.disputes.models import Dispute, Judgment
from apps.disputes.similarity_engine import SimilarityEngine
from decimal import Decimal

@pytest.mark.django_db
def test_similarity_engine_heuristic(admin_user, regular_user, product, booking):
    """
    Test that the SimilarityEngine correctly identifies similar disputes 
    based on keyword overlap.
    """
    # 1. Create a "Precedent" (Closed Dispute with Judgment)
    precedent_dispute = Dispute.objects.create(
        user=regular_user,
        booking=booking,
        title="Damaged Silk Dress",
        description="The silk dress was returned with a large wine stain on the front.",
        status="judgment_final",
        priority="medium"
    )
    Judgment.objects.create(
        dispute=precedent_dispute,
        judge=admin_user,
        verdict="favor_owner",
        ruling_text="Tenant is liable for stains that cannot be removed.",
        awarded_amount=Decimal("500.00"),
        status="final"
    )

    # 2. Create a "New Case" (Open Dispute) - Similar
    similar_dispute = Dispute.objects.create(
        user=regular_user, # Same user doesn't matter for similarity
        booking=booking,
        title="Stained Evening Gown",
        description="There is a red wine stain on the gown.", # Keywords: wine, stain
        status="admissible",
        priority="medium"
    )

    # 3. Create a "Noise Case" (Open Dispute) - Dissimilar
    # Create another precedent that shouldn't match
    irrelevant_dispute = Dispute.objects.create(
        user=regular_user,
        booking=booking,
        title="Late Return",
        description="The item was returned three days late.",
        status="judgment_final",
        priority="medium"
    )
    Judgment.objects.create(
        dispute=irrelevant_dispute,
        judge=admin_user,
        verdict="favor_owner",
        ruling_text="Late fees apply.",
        awarded_amount=Decimal("100.00"),
        status="final"
    )

    # 4. Run Engine
    matches = SimilarityEngine.find_similar_judgments(similar_dispute)
    
    # 5. Verify
    assert len(matches) > 0
    # Should match the first one (stain)
    assert matches[0]['judgment'].dispute.title == "Damaged Silk Dress"
    # Should not match relevance (or have very low score)
    # Check if irrelevant one is present (heuristic might pick up 'the' 'was' if not filtered well, 
    # but we added stop words)
    relevant_ids = [m['judgment'].dispute.id for m in matches]
    assert precedent_dispute.id in relevant_ids
    
    # Check Score
    print(f"Matches: {matches}")


@pytest.mark.django_db
def test_process_precedent_integration_in_api(admin_client, admin_user, regular_user, product, booking):
    """
    Test that the Tribunal API returns related_precedents.
    """
    # 1. Setup Precedent
    precedent_dispute = Dispute.objects.create(
        user=regular_user,
        booking=booking,
        title="Torn Hem",
        description="The hem was torn during the event.",
        status="judgment_final"
    )
    Judgment.objects.create(
        dispute=precedent_dispute,
        judge=admin_user,
        verdict="split",
        ruling_text="Wear and tear partially covers this.",
        awarded_amount=Decimal("50.00"),
        status="final"
    )
    
    # 2. Setup Active Case
    current_dispute = Dispute.objects.create(
        user=regular_user,
        booking=booking,
        title="Ripped Seam",
        description="The seam was torn and ripped.",
        status="admissible"
    )

    # 3. Call API
    url = reverse('tribunal-case-detail', kwargs={'dispute_id': current_dispute.id})
    response = admin_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # 4. Verify Payload
    assert 'related_precedents' in data
    precedents = data['related_precedents']
    assert len(precedents) > 0
    assert precedents[0]['dispute_title'] == "Torn Hem"
    assert 'similarity_score' in precedents[0]
