"""
Phase 43: Judicial Explainability Helper
Translates technical AI metrics into plain legal language.

Core Principle: No mention of "vectors", "embeddings", "similarity_%".
Use terms like "Precedent Alignment", "Case Similarity", "Procedural Consistency".
"""

from decimal import Decimal
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class ExplainabilityHelper:
    """
    Converts AI/ML outputs into human-readable legal explanations.
    Phase 43: Ensuring tribunal proposals are understandable without AI expertise.
    """
    
    @staticmethod
    def describe_precedent_strength(similarity_score: float) -> str:
        """
        Convert technical similarity score to legal terminology.
        
        Args:
            similarity_score: Float between 0.0-1.0 from vector similarity
            
        Returns:
            Plain language description (e.g., "Substantially Similar")
        """
        if similarity_score >= 0.90:
            return "Substantially Similar"
        elif similarity_score >= 0.75:
            return "Closely Aligned"
        elif similarity_score >= 0.60:
            return "Moderately Similar"
        else:
            return "Weakly Related"
    
    @staticmethod
    def generate_legal_rationale(
        valid_cases: list,
        suggested_amount: Decimal,
        booking_price: Decimal,
        is_fallback: bool = False
    ) -> Dict[str, any]:
        """
        Creates a structured, plain-language explanation for mediation proposals.
        
        Args:
            valid_cases: List of dicts with 'judgment' and 'similarity_score'
            suggested_amount: The proposed settlement amount
            booking_price: Total booking value (for context)
            is_fallback: Whether this is using fallback logic (no precedents)
            
        Returns:
            dict with keys:
                - why_this_value: str (plain language explanation)
                - reference_cases: list[str] (human-readable case summaries)
                - confidence_min: Decimal
                - confidence_max: Decimal
        """
        # Ensure Decimal types (handle float inputs gracefully)
        suggested_amount = Decimal(str(suggested_amount))
        booking_price = Decimal(str(booking_price))
        if is_fallback:
            # No precedents - explain equity logic
            return {
                'why_this_value': (
                    f"In the absence of directly applicable precedents, this tribunal "
                    f"applies the principle of equitable division. The proposed settlement "
                    f"of {suggested_amount} DZD represents a balanced approach pending "
                    f"further evidence or judicial review."
                ),
                'reference_cases': [],
                'confidence_min': suggested_amount * Decimal('0.85'),
                'confidence_max': suggested_amount * Decimal('1.15')
            }
        
        # Calculate variance for confidence interval
        amounts = [c['judgment'].awarded_amount for c in valid_cases]
        avg_amount = sum(amounts) / len(amounts) if amounts else suggested_amount
        std_dev = Decimal('0.00')
        
        if len(amounts) > 1:
            # Simple standard deviation calculation
            variance = sum((amt - avg_amount) ** 2 for amt in amounts) / len(amounts)
            std_dev = Decimal(str(variance)) ** Decimal('0.5')
        
        # Confidence interval: ±1 std dev, capped at ±20%
        margin = min(std_dev, suggested_amount * Decimal('0.20'))
        confidence_min = max(Decimal('0'), suggested_amount - margin)
        confidence_max = suggested_amount + margin
        
        # Build explanation
        top_case = valid_cases[0]
        top_strength = ExplainabilityHelper.describe_precedent_strength(
            top_case['similarity_score']
        )
        
        why_text = (
            f"Based on established precedent in {len(valid_cases)} previous dispute(s) "
            f"of similar nature, this tribunal proposes {suggested_amount} DZD as fair resolution. "
            f"The most relevant reference case demonstrates {top_strength.lower()} factual circumstances. "
            f"This proposal reflects procedural consistency with established jurisprudence."
        )
        
        # Generate case summaries
        reference_cases = []
        for case in valid_cases[:3]:  # Cite top 3 max
            judgment = case['judgment']
            dispute = judgment.dispute
            strength = ExplainabilityHelper.describe_precedent_strength(case['similarity_score'])
            
            summary = (
                f"Case {dispute.id}: {verdict_to_plain(judgment.verdict)} resolution "
                f"({judgment.awarded_amount} DZD awarded). "
                f"Alignment: {strength}."
            )
            reference_cases.append(summary)
        
        return {
            'why_this_value': why_text,
            'reference_cases': reference_cases,
            'confidence_min': confidence_min.quantize(Decimal('0.01')),
            'confidence_max': confidence_max.quantize(Decimal('0.01'))
        }
    
    @staticmethod
    def format_structured_explanation(rationale_dict: dict) -> str:
        """
        Formats the rationale dictionary into a multi-section text block.
        
        Returns:
            Formatted string with WHY/REFERENCES/RANGE sections
        """
        sections = []
        
        # Section 1: Why This Value
        sections.append(f"WHY THIS VALUE:\n{rationale_dict['why_this_value']}")
        
        # Section 2: Reference Cases (if any)
        if rationale_dict['reference_cases']:
            refs = "\n".join(f"• {ref}" for ref in rationale_dict['reference_cases'])
            sections.append(f"REFERENCE CASES:\n{refs}")
        
        # Section 3: Confidence Range
        sections.append(
            f"CONFIDENCE RANGE:\n"
            f"This tribunal estimates fair resolution between "
            f"{rationale_dict['confidence_min']}-{rationale_dict['confidence_max']} DZD "
            f"based on case variance and procedural precedent."
        )
        
        return "\n\n".join(sections)


def verdict_to_plain(verdict_code: str) -> str:
    """Convert verdict codes to plain language."""
    mapping = {
        'favor_owner': 'Owner-favorable',
        'favor_tenant': 'Tenant-favorable',
        'split': 'Equitable split',
        'dismissed': 'Dismissed'
    }
    return mapping.get(verdict_code, verdict_code.replace('_', ' ').title())
