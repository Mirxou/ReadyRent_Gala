"""
Test real ML model vs Mock mode
"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.disputes.precedent_search_service import PrecedentSearchService
from django.conf import settings

def test_real_model():
    print("🧪 TESTING REAL ML MODEL")
    print(f"USE_MOCK: {settings.SOVEREIGN_AI['USE_MOCK']}")
    print(f"MODEL_NAME: {settings.SOVEREIGN_AI['MODEL_NAME']}")
    
    # Test embedding generation
    test_text_ar = "المستأجر تأخر في دفع الإيجار لمدة شهرين"
    test_text_fr = "Le locataire a tardé à payer le loyer pendant deux mois"
    
    print("\n>> Generating embeddings...")
    
    # Arabic
    print(f"\nText (Arabic): {test_text_ar}")
    embedding_ar = PrecedentSearchService.generate_embedding(test_text_ar)
    print(f"Embedding dimension: {len(embedding_ar)}")
    print(f"Sample values: {embedding_ar[:5]}")
    
    # French
    print(f"\nText (French): {test_text_fr}")
    embedding_fr = PrecedentSearchService.generate_embedding(test_text_fr)
    print(f"Embedding dimension: {len(embedding_fr)}")
    print(f"Sample values: {embedding_fr[:5]}")
    
    # Test similarity
    import math
    def cosine_similarity(v1, v2):
        dot = sum(a*b for a, b in zip(v1, v2))
        mag1 = math.sqrt(sum(a**2 for a in v1))
        mag2 = math.sqrt(sum(b**2 for b in v2))
        return dot / (mag1 * mag2) if mag1 and mag2 else 0
    
    similarity = cosine_similarity(embedding_ar, embedding_fr)
    print(f"\n📊 Semantic Similarity (AR ↔ FR): {similarity:.4f}")
    print(f"   Expected: High similarity (same meaning)")
    
    # Test different texts
    unrelated_text = "الطقس جميل اليوم"
    embedding_unrelated = PrecedentSearchService.generate_embedding(unrelated_text)
    similarity_unrelated = cosine_similarity(embedding_ar, embedding_unrelated)
    print(f"\n📊 Similarity (Rent vs Weather): {similarity_unrelated:.4f}")
    print(f"   Expected: Low similarity (different topics)")
    
    print("\n✅ REAL ML MODEL TEST COMPLETE")
    
    if settings.SOVEREIGN_AI['USE_MOCK']:
        print("\n⚠️ NOTE: System is in MOCK mode. Set USE_MOCK=False for production.")
    else:
        print("\n🚀 System is using REAL ML model (Production Ready)")

if __name__ == "__main__":
    try:
        test_real_model()
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
