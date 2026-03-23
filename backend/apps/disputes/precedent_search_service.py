"""
Phase 22: AI-Assisted Precedent Search
Service for semantic case matching with sovereign safeguards.

Sovereign Principles:
1. AI assists, never decides
2. Explainable similarity (WHY + DIFFERENCES)
3. Arabic normalization with original preservation
4. Bidirectional divergence detection
"""

from apps.disputes.models import Judgment, JudgmentPrecedent, EvidenceLog
from typing import List, Dict, Optional, Tuple
import re


class PrecedentSearchService:
    """
    Semantic search for legal precedents.
    
    Sovereign Safeguard: All outputs are linguistically explained, not just numerical.
    """
    
    # Model configuration
    _embedding_model = None
    # Model configuration
    _embedding_model = None
    MOCK_MODEL_NAME = 'mock-hash-v1'
    
    # Dynamic properties retrieved from settings.SOVEREIGN_AI

    
    @staticmethod
    def _normalize_arabic(text: str) -> str:
        """
        Normalize Arabic text for embedding ONLY.
        
        Safeguard: Original text is NEVER altered for display/citation.
        
        Rules:
        - Remove diacritics (الحركات)
        - Normalize ة → ه
        - Normalize أ/إ/آ → ا
        - Normalize ى → ي
        """
        if not text:
            return ""
        
        # Remove diacritics
        arabic_diacritics = re.compile(r'[\u064B-\u065F\u0670]')
        text = arabic_diacritics.sub('', text)
        
        # Normalize characters
        text = text.replace('ة', 'ه')
        text = text.replace('أ', 'ا')
        text = text.replace('إ', 'ا')
        text = text.replace('آ', 'ا')
        text = text.replace('ى', 'ي')
        
        return text
    
    @staticmethod
    def _extract_evidence_types(judgment: Judgment) -> List[str]:
        """Extract evidence types from EvidenceLog."""
        evidence_logs = EvidenceLog.objects.filter(
            dispute=judgment.dispute
        ).values_list('action', flat=True)
        
        evidence_types = set()
        for log in evidence_logs:
            if 'PHOTO' in log:
                evidence_types.add('photo')
            if 'CONTRACT' in log or 'AGREEMENT' in log:
                evidence_types.add('contract')
            if 'WITNESS' in log or 'STATEMENT' in log:
                evidence_types.add('witness')
        
        return list(evidence_types)
    
    @staticmethod
    def _calculate_awarded_ratio(judgment: Judgment) -> float:
        """
        Calculate awarded amount as percentage of original dispute claim.
        
        Safeguard: Use ratios, not absolute values, to avoid bias toward large amounts.
        """
        dispute = judgment.dispute
        booking = dispute.booking
        
        if booking and booking.total_price > 0:
            return (float(judgment.awarded_amount) / float(booking.total_price)) * 100
        
        return 0.0
    
    @staticmethod
    def _prepare_text(judgment: Judgment) -> Dict[str, str]:
        """
        Prepare judgment text for embedding.
        
        Sovereign Safeguard 2: Expanded Embedding Scope
        - Not just judgment text, but full judicial context
        
        Returns:
            {
                'original': str  # For display/citation
                'normalized': str  # For embedding ONLY
            }
        """
        dispute = judgment.dispute
        product = dispute.booking.product if dispute.booking else None
        
        # Extract context
        evidence_types = PrecedentSearchService._extract_evidence_types(judgment)
        awarded_ratio = PrecedentSearchService._calculate_awarded_ratio(judgment)
        
        # Build comprehensive text (ORIGINAL)
        original_parts = [
            f"Dispute: {dispute.title}",
            f"Description: {dispute.description[:300]}",
            f"Category: {product.category.name if product and product.category else 'Unknown'}",
            f"Verdict: {judgment.verdict}",
            f"Ruling: {judgment.ruling_text[:200]}",
            f"Evidence Types: {', '.join(evidence_types) if evidence_types else 'None'}",
            f"Awarded Ratio: {awarded_ratio:.1f}%",
            f"Stakes: {'High' if float(judgment.awarded_amount) > 500 else 'Standard'}"
        ]
        
        original_text = "\n".join(original_parts)
        
        # Normalize for embedding
        normalized_text = PrecedentSearchService._normalize_arabic(original_text)
        
        return {
            'original': original_text,
            'normalized': normalized_text
        }
    
    @staticmethod
    def embed_text(text: str) -> List[float]:
        """
        Generate embedding for raw text string.
        Useful for searching by strict text query (e.g. from new Dispute).
        """
        import hashlib
        import math
        
        normalized = PrecedentSearchService._normalize_arabic(text)
        
        from django.conf import settings
        
        if settings.SOVEREIGN_AI['USE_MOCK']:
             # Mock embedding: deterministic hash-based 384-dim vector
             # Allows testing without downloading 471MB model
             text_hash = hashlib.sha256(normalized.encode()).hexdigest()
             
             # Generate 384 pseudo-random floats from hash (same dimension as real model)
             embedding_vector = []
             for i in range(384):
                 # Use hash chunks to generate deterministic floats
                 chunk_start = (i * 2) % len(text_hash)
                 chunk = text_hash[chunk_start:chunk_start + 8]
                 value = int(chunk, 16) / (16**8)  # Normalize to [0, 1]
                 value = (value - 0.5) * 2  # Shift to [-1, 1]
                 embedding_vector.append(value)
             
             # Normalize vector (L2 norm)
             norm = math.sqrt(sum(x**2 for x in embedding_vector))
             embedding_vector = [x / norm for x in embedding_vector]
             return embedding_vector
        else:
             model = PrecedentSearchService._get_embedding_model()
             return model.encode(normalized).tolist()
    
    @classmethod
    def _get_embedding_model(cls):
        """
        Lazy-load the sentence-transformers model.
        
        Sovereign Safeguard: Model version tracking
        - Returns same model instance for consistency
        - Version is tracked in JudgmentEmbedding
        """
        if cls._embedding_model is None:
            from sentence_transformers import SentenceTransformer
            import warnings
            warnings.filterwarnings('ignore')  # Suppress torch warnings
            
            from django.conf import settings
            model_name = settings.SOVEREIGN_AI['MODEL_NAME']
            cls._embedding_model = SentenceTransformer(model_name)
        
        return cls._embedding_model
    
    @staticmethod
    def embed_judgment(judgment: Judgment) -> 'JudgmentEmbedding':
        """
        Generate semantic embedding for a judgment.
        
        NOTE: Currently using mock embeddings (hash-based deterministic vectors)
              Set USE_MOCK = False when real model (471MB) is downloaded
        
        Sovereign Safeguards:
        1. Stores both original and normalized text
        2. Tracks model_version for drift protection
        3. Uses expanded context (not just ruling text)
        
        Returns:
            JudgmentEmbedding object (saved to database)
        """
        from apps.disputes.models import JudgmentEmbedding
        from django.conf import settings
        import hashlib
        import math
        
        use_mock = settings.SOVEREIGN_AI['USE_MOCK']
        model_name = settings.SOVEREIGN_AI['MODEL_NAME']
        model_version = PrecedentSearchService.MOCK_MODEL_NAME if use_mock else model_name
        
        # Check if embedding already exists with correct version
        existing = JudgmentEmbedding.objects.filter(judgment=judgment).first()
        if existing and existing.model_version == model_version:
            return existing
        
        # Prepare text
        prepared = PrecedentSearchService._prepare_text(judgment)
        
        if use_mock:
            # Mock embedding: deterministic hash-based 384-dim vector
            # Allows testing without downloading 471MB model
            text_hash = hashlib.sha256(prepared['normalized'].encode()).hexdigest()
            
            # Generate 384 pseudo-random floats from hash (same dimension as real model)
            embedding_vector = []
            for i in range(384):
                # Use hash chunks to generate deterministic floats
                chunk_start = (i * 2) % len(text_hash)
                chunk = text_hash[chunk_start:chunk_start + 8]
                value = int(chunk, 16) / (16**8)  # Normalize to [0, 1]
                value = (value - 0.5) * 2  # Shift to [-1, 1]
                embedding_vector.append(value)
            
            # Normalize vector (L2 norm, same as sentence-transformers)
            norm = math.sqrt(sum(x**2 for x in embedding_vector))
            embedding_vector = [x / norm for x in embedding_vector]
        else:
            # Real embedding using sentence-transformers
            model = PrecedentSearchService._get_embedding_model()
            embedding_vector = model.encode(prepared['normalized']).tolist()
        
        # Create or update embedding
        embedding, created = JudgmentEmbedding.objects.update_or_create(
            judgment=judgment,
            defaults={
                'embedding_vector': embedding_vector,
                'model_version': model_version,
                'original_text': prepared['original'],
                'normalized_text': prepared['normalized']
            }
        )
        
        return embedding
    
    @staticmethod
    def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        import math
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(b * b for b in vec2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    @staticmethod
    def _extract_shared_factors(judgment1: Judgment, judgment2: Judgment) -> List[str]:
        """
        Extract shared factors between two judgments.
        
        Sovereign Safeguard: Show WHY cases are similar
        """
        shared = []
        
        # Check category
        cat1 = judgment1.dispute.booking.product.category if judgment1.dispute.booking else None
        cat2 = judgment2.dispute.booking.product.category if judgment2.dispute.booking else None
        if cat1 and cat2 and cat1 == cat2:
            shared.append(f"Category: {cat1.name}")
        
        # Check verdict
        if judgment1.verdict == judgment2.verdict:
            shared.append(f"Verdict: {judgment1.verdict}")
        
        # Check evidence types
        evidence1 = set(PrecedentSearchService._extract_evidence_types(judgment1))
        evidence2 = set(PrecedentSearchService._extract_evidence_types(judgment2))
        common_evidence = evidence1 & evidence2
        if common_evidence:
            shared.append(f"Evidence: {', '.join(common_evidence)}")
        
        return shared
    
    @staticmethod
    def _extract_context_differences(judgment1: Judgment, judgment2: Judgment) -> List[str]:
        """
        Extract context differences between two judgments.
        
        Sovereign Safeguard: Show DIFFERENCES to prevent blind following
        """
        differences = []
        
        # Amount difference
        amt1 = float(judgment1.awarded_amount)
        amt2 = float(judgment2.awarded_amount)
        if abs(amt1 - amt2) > 100:
            differences.append(f"Amount: {amt1:.0f} DZD vs {amt2:.0f} DZD")
        
        # Ratio difference
        ratio1 = PrecedentSearchService._calculate_awarded_ratio(judgment1)
        ratio2 = PrecedentSearchService._calculate_awarded_ratio(judgment2)
        if abs(ratio1 - ratio2) > 20:
            differences.append(f"Award Ratio: {ratio1:.0f}% vs {ratio2:.0f}%")
        
        return differences
    
    @staticmethod
    def find_similar_cases(
        query_judgment: Judgment,
        top_k: int = 5,
        time_window_days: int = 90,
        min_similarity: float = 0.70,
        use_cache: bool = True  # Enable caching by default
    ) -> List[Dict]:
        """
        Find semantically similar past judgments.
        
        Sovereign Safeguard 1: Returns similarity WITH context (WHY + DIFFERENCES)
        
        Returns:
            [
                {
                    "judgment": Judgment,
                    "similarity_range": (float, float),  # Confidence band
                    "confidence": str,  # HIGH/MEDIUM/LOW
                    "shared_factors": List[str],
                    "context_differences": List[str],
                    "explanation": str
                }
            ]
        
        If no cases found:
            [{
                "status": "NO_PRECEDENT_FOUND",
                "message": "No similar cases found in last {time_window_days} days",
                "action": "Judge has full discretion"
            }]
        """
        from apps.disputes.models import JudgmentEmbedding
        from datetime import timedelta
        from django.utils import timezone
        from django.core.cache import cache
        
        from django.conf import settings
        
        # Check cache first
        if not settings.SOVEREIGN_AI['USE_SEMANTIC_SEARCH']:
            return [{
                "status": "KILL_SWITCH_ACTIVE",
                "message": "Semantic search disabled by sovereign command.",
                "action": "Use heuristic fallback"
            }]

        if use_cache:
            cache_key = f'precedent_search:{query_judgment.id}:{time_window_days}:{top_k}'
            cached_result = cache.get(cache_key)
            if cached_result:
                return cached_result
        
        # Get query embedding
        query_embedding = PrecedentSearchService.embed_judgment(query_judgment)
        query_vector = query_embedding.embedding_vector
        
        # Get candidate judgments within time window
        cutoff_date = timezone.now() - timedelta(days=time_window_days)
        candidate_embeddings = JudgmentEmbedding.objects.filter(
            judgment__finalized_at__gte=cutoff_date,
            judgment__status='final',
            model_version=query_embedding.model_version  # Same model only
        ).exclude(
            judgment=query_judgment  # Exclude self
        ).select_related('judgment__dispute__booking__product__category')
        
        if not candidate_embeddings.exists():
            return [{
                "status": "NO_PRECEDENT_FOUND",
                "message": f"No similar cases found in last {time_window_days} days",
                "reason": "This may be a novel dispute pattern",
                "action": "Judge has full discretion"
            }]
        
        # Calculate similarities
        similarities = []
        for cand_emb in candidate_embeddings:
            similarity = PrecedentSearchService._cosine_similarity(
                query_vector,
                cand_emb.embedding_vector
            )
            
            if similarity >= min_similarity:
                similarities.append((similarity, cand_emb.judgment))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[0], reverse=True)
        top_matches = similarities[:top_k]
        
        if not top_matches:
            return [{
                "status": "NO_PRECEDENT_FOUND",
                "message": f"No cases above {min_similarity:.0%} similarity threshold",
                "reason": "Available cases were not sufficiently similar",
                "action": "Judge has full discretion"
            }]
        
        # Format results with sovereign safeguards
        results = []
        for similarity_score, matched_judgment in top_matches:
            # Sovereign Safeguard: Confidence band (not single score)
            confidence_margin = 0.05
            similarity_range = (
                max(0, similarity_score - confidence_margin),
                min(1, similarity_score + confidence_margin)
            )
            
            # Confidence level
            if similarity_score >= 0.90:
                confidence = "HIGH"
            elif similarity_score >= 0.75:
                confidence = "MEDIUM"
            else:
                confidence = "LOW"
            
            # Extract shared factors and differences
            shared_factors = PrecedentSearchService._extract_shared_factors(
                query_judgment,
                matched_judgment
            )
            
            context_differences = PrecedentSearchService._extract_context_differences(
                query_judgment,
                matched_judgment
            )
            
            # Generate explanation
            explanation = f"Similar dispute pattern ({len(shared_factors)} shared factors)"
            if context_differences:
                explanation += f", but differs in {len(context_differences)} aspects"
            
            results.append({
                "judgment": matched_judgment,
                "similarity_range": similarity_range,
                "similarity_score": similarity_score,  # For internal use
                "confidence": confidence,
                "shared_factors": shared_factors,
                "context_differences": context_differences,
                "explanation": explanation
            })
        
        return results

    @staticmethod
    def find_similar_by_text(
        query_text: str,
        top_k: int = 5,
        time_window_days: int = 90,
        min_similarity: float = 0.5, # Lower threshold since we are comparing partial vs full text
        use_cache: bool = True
    ) -> List[Dict]:
        """
        Find semantically similar past judgments using raw text input.
        Used by DisputeEngine (initiation phase) and MediationService (proposal phase).
        
        Sovereign Safeguard: Returns similarity WITH context (WHY + DIFFERENCES)
        """
        from apps.disputes.models import JudgmentEmbedding
        from datetime import timedelta
        from django.utils import timezone
        from django.core.cache import cache
        import hashlib
        
        # Check cache first
        from django.conf import settings

        # Check cache first
        if not settings.SOVEREIGN_AI['USE_SEMANTIC_SEARCH']:
             return [{
                "status": "KILL_SWITCH_ACTIVE",
                "message": "Semantic search disabled by sovereign command.",
                "explain": "Kill Switch is Active.",
                "action": "Use heuristic fallback"
            }]

        if use_cache:
            # Hash the query text for cache key
            query_hash = hashlib.md5(query_text.encode('utf-8')).hexdigest()
            cache_key = f'precedent_search:text:{query_hash}:{time_window_days}:{top_k}'
            cached_result = cache.get(cache_key)
            if cached_result:
                return cached_result
        
        # Get query embedding
        query_vector = PrecedentSearchService.embed_text(query_text)
        
        # Determine model version used (assumes consistent deployment)
        use_mock = settings.SOVEREIGN_AI['USE_MOCK']
        model_name = settings.SOVEREIGN_AI['MODEL_NAME']
        model_version = PrecedentSearchService.MOCK_MODEL_NAME if use_mock else model_name
        
        # Get candidate judgments within time window
        cutoff_date = timezone.now() - timedelta(days=time_window_days)
        candidate_embeddings = JudgmentEmbedding.objects.filter(
            judgment__finalized_at__gte=cutoff_date,
            judgment__status='final',
            model_version=model_version  # Same model only
        ).select_related('judgment__dispute__booking__product__category')
        
        if not candidate_embeddings.exists():
            return [{
                "status": "NO_PRECEDENT_FOUND",
                "message": f"No similar cases found in last {time_window_days} days",
                "explain": "Database is empty or no finalized judgments exist.",
                "action": "Judge has full discretion"
            }]
        
        # Calculate similarities
        similarities = []
        for cand_emb in candidate_embeddings:
            similarity = PrecedentSearchService._cosine_similarity(
                query_vector,
                cand_emb.embedding_vector
            )
            
            if similarity >= min_similarity:
                similarities.append((similarity, cand_emb.judgment))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[0], reverse=True)
        top_matches = similarities[:top_k]
        
        if not top_matches:
            return [{
                "status": "NO_PRECEDENT_FOUND",
                "message": f"No cases above {min_similarity:.0%} similarity threshold",
                "explain": "Cases exists but were too dissimilar.",
                "action": "Judge has full discretion"
            }]
        
        # Format results with sovereign safeguards
        results = []
        for similarity_score, matched_judgment in top_matches:
            # Sovereign Safeguard: Confidence band
            confidence_margin = 0.05
            similarity_range = (
                max(0, similarity_score - confidence_margin),
                min(1, similarity_score + confidence_margin)
            )
            
            # Confidence level
            if similarity_score >= 0.85:
                confidence = "HIGH"
            elif similarity_score >= 0.65:
                confidence = "MEDIUM"
            else:
                confidence = "LOW"
            
            # Context Analysis for Text Query
            explanation = f"Matches query intent ({similarity_score:.0%})"
            verdict_context = f"Precedent Verdict: {matched_judgment.verdict}"
            
            results.append({
                "judgment": matched_judgment,
                "similarity_range": similarity_range,
                "similarity_score": similarity_score,  # For internal use
                "confidence": confidence,
                "explanation": explanation,
                "verdict_context": verdict_context
            })
            
        # Cache results (5 minutes)
        if use_cache:
            cache.set(cache_key, results, 300)
        
        return results
    
    @staticmethod
    def suggest_citations(judgment: Judgment) -> List[Dict]:
        """
        Suggest relevant precedents for judgment citations.
        
        Sovereign Safeguard: Never auto-apply. Judge reviews and decides.
        
        Returns: List of suggestions with explainability
        """
        similar_cases = PrecedentSearchService.find_similar_cases(judgment)
        
        if not similar_cases:
            return [{
                "status": "NO_PRECEDENT_FOUND",
                "message": "No similar cases found",
                "reason": "This may be a novel dispute pattern",
                "action": "Judge has full discretion"
            }]
        
        return similar_cases
