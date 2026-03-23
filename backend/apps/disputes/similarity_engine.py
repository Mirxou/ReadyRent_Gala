from django.db.models import Q
from .models import Judgment, Dispute

class SimilarityEngine:
    """
    Phase 37: Institutional Memory.
    Finds relevant past judgments to guide current decisions.
    
    MVP Implementation: Heuristic/Keyword matching.
    Future: Vector Embeddings (pgvector).
    """
    
    @staticmethod
    def find_similar_judgments(dispute, limit=3):
        """
        Returns a list of Judgment objects that are contextually similar 
        to the current dispute.
        """
        # 1. Base Corpus: Only Final (Settled) Judgments
        # We only want to cite defined law, not open debates.
        base_queryset = Judgment.objects.filter(
            status__in=['final', 'final_enforceable']
        ).select_related('dispute')
        
        # 2. Heuristic Filter A: Same Category (if available) -> implied by description keywords for now
        # In a real app, we'd filter by dispute.category
        
        # 3. Heuristic Filter B: Keyword Overlap
        # Extract keywords from current dispute description
        # Simple stop-word removal (very basic)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'is', 'was', 'in', 'on', 'at', 'to', 'for', 'of', 'with'}
        current_words = set([
            w.lower() for w in dispute.description.split() 
            if w.lower() not in stop_words and len(w) > 3
        ])
        
        scored_judgments = []
        
        for judgment in base_queryset:
            # Skip self if it somehow appeared
            if judgment.dispute.id == dispute.id:
                continue
                
            # Score calculation
            # Overlap with precedence description
            past_desc = judgment.dispute.description
            past_words = set([
                w.lower() for w in past_desc.split() 
                if w.lower() not in stop_words and len(w) > 3
            ])
            
            # Jaccard Similarity (Intersection over Union)
            intersection = len(current_words.intersection(past_words))
            union = len(current_words.union(past_words))
            
            score = 0.0
            if union > 0:
                score = intersection / union
                
            # Boost if verdict type matches a hypothesis (not used here yet)
            
            if score > 0.05: # Minimum threshold to reduce noise
                scored_judgments.append({
                    'judgment': judgment,
                    'similarity_score': score
                })
        
        # 4. Sort and Slice
        scored_judgments.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Return just the judgment objects, maybe attach score?
        # For the serializer, we'll return a struct
        return scored_judgments[:limit]
