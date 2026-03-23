"""
Enhanced API Documentation using drf-spectacular
This file adds @extend_schema decorators to existing ViewSets
"""
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiResponse

# Documentation for DisputeViewSet.create
dispute_create_schema = extend_schema(
    operation_id="disputes_create",
    summary="File a new dispute",
    description="""
    Create a new dispute with claimed amount and details.
    
    **Sovereign Process:**
    1. Dispute is auto-assigned to a judicial panel
    2. Mediation session is created automatically
    3. AI generates initial settlement offer
    """,
    request={
        "application/json": {
            "example": {
                "title": "Broken Camera Lens",
                "description": "The rented camera arrived with a cracked lens. I couldn't use it for my event.",
                "claimed_amount": "3000.00",
                "booking": 1
            }
        }
    },
    responses={
        201: OpenApiResponse(
            description="Dispute created successfully",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "id": 1,
                        "title": "Broken Camera Lens",
                        "status": "open",
                        "claimed_amount": "3000.00",
                        "created_at": "2026-02-12T19:00:00Z"
                    }
                )
            ]
        )
    },
    tags=["Disputes"]
)

# Documentation for DisputeViewSet.mediation_session
mediation_session_schema = extend_schema(
    operation_id="disputes_mediation_session",
    summary="Get mediation session for dispute",
    description="""
    Retrieve the active mediation session and all AI-generated settlement offers.
    
    **Note:** PENDING_REVIEW offers (>5000 DZD) are hidden until admin approval.
    """,
    responses={
        200: OpenApiResponse(
            description="Mediation session details",
            examples=[
                OpenApiExample(
                    "Active Mediation",
                    value={
                        "id": 1,
                        "dispute": 1,
                        "status": "active",
                        "current_round": 1,
                        "max_rounds": 3,
                        "expires_at": "2026-02-15T19:00:00Z",
                        "offers": [
                            {
                                "id": 1,
                                "amount": "1500.00",
                                "source": "system",
                                "reasoning": "Based on 3 similar precedents (avg. 50% award)",
                                "status": "visible"
                            }
                        ]
                    }
                )
            ]
        ),
        404: OpenApiResponse(description="No mediation session exists")
    },
    tags=["Mediation"]
)

# Documentation for SettlementOfferViewSet.accept
offer_accept_schema = extend_schema(
    operation_id="settlement_offers_accept",
    summary="Accept settlement offer",
    description="""
    Accept this settlement offer to resolve the dispute.
    
    **Effect:**
    1. Dispute status → CLOSED
    2. Escrow funds released
    3. Evidence logged
    """,
    request=None,
    responses={
        200: OpenApiResponse(
            description="Offer accepted successfully",
            examples=[
                OpenApiExample(
                    "Success",
                    value={"message": "Offer accepted. Dispute resolved."}
                )
            ]
        ),
        400: OpenApiResponse(description="Offer already accepted")
    },
    tags=["Settlement Offers"]
)

# Documentation for SettlementOfferViewSet.reject
offer_reject_schema = extend_schema(
    operation_id="settlement_offers_reject",
    summary="Reject settlement offer",
    description="""
    Reject this settlement offer.
    
    **Effect:**
    1. Mediation round increments
    2. New offer may be generated (if under max_rounds)
    3. Or escalate to tribunal if rounds exhausted
    """,
    request=None,
    responses={
        200: OpenApiResponse(
            description="Offer rejected",
            examples=[
                OpenApiExample(
                    "Success",
                    value={"message": "Offer rejected. Proceeding to next round."}
                )
            ]
        )
    },
    tags=["Settlement Offers"]
)

# Documentation for AdminOfferViewSet.pending
admin_pending_schema = extend_schema(
    operation_id="admin_offers_pending",
    summary="[ADMIN] List pending offers",
    description="""
    **The Sovereign Gate**
    
    List all settlement offers awaiting admin approval (>5000 DZD threshold).
    
    **Staff Only:** Requires `is_staff = True`
    """,
    responses={
        200: OpenApiResponse(
            description="List of pending offers",
            examples=[
                OpenApiExample(
                    "Pending Offers",
                    value=[
                        {
                            "id": 1,
                            "amount": "6000.00",
                            "status": "pending_review",
                            "session": {
                                "dispute": {
                                    "title": "High-value claim",
                                    "priority": "high"
                                }
                            },
                            "created_at": "2026-02-12T18:00:00Z"
                        }
                    ]
                )
            ]
        )
    },
    tags=["Admin - Sovereign Gate"]
)

# Documentation for AdminOfferViewSet.approve
admin_approve_schema = extend_schema(
    operation_id="admin_offers_approve",
    summary="[ADMIN] Approve offer (Open Gate)",
    description="""
    **The Sovereign Gate - OPEN**
    
    Approve this AI-generated offer, making it visible to dispute parties.
    
    **Effect:**
    1. Status: PENDING_REVIEW → VISIBLE
    2. Parties can now accept/reject
    3. Action logged in EvidenceLog
    """,
    request=None,
    responses={
        200: OpenApiResponse(
            description="Offer approved",
            examples=[
                OpenApiExample(
                    "Success",
                    value={"message": "Offer approved and made visible to parties."}
                )
            ]
        ),
        400: OpenApiResponse(description="Offer not in pending state")
    },
    tags=["Admin - Sovereign Gate"]
)

# Documentation for AdminOfferViewSet.reject_offer
admin_reject_schema = extend_schema(
    operation_id="admin_offers_reject",
    summary="[ADMIN] Reject offer (Close Gate)",
    description="""
    **The Sovereign Gate - CLOSE**
    
    Reject this AI-generated offer. It will not be shown to parties.
    
    **Effect:**
    1. Status: PENDING_REVIEW → REJECTED
    2. Offer hidden from parties
    3. Reason logged
    """,
    request={
        "application/json": {
            "example": {
                "reason": "Amount too high for this type of damage"
            }
        }
    },
    responses={
        200: OpenApiResponse(
            description="Offer rejected",
            examples=[
                OpenApiExample(
                    "Success",
                    value={"message": "Offer rejected."}
                )
            ]
        )
    },
    tags=["Admin - Sovereign Gate"]
)
