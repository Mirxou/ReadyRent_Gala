import random
from django.contrib.auth import get_user_model
from apps.products.services import ProductService
from apps.users.models import VerificationStatus
from apps.products.models import Category

User = get_user_model()

print("--- 🧠 Intelligent Trust Gateway Test ---")

# Setup: Get Category
category, _ = Category.objects.get_or_create(
    slug='test-logic-cat-v2',
    defaults={'name': 'Logic Test V2', 'name_ar': 'اختبار المنطق 2', 'is_active': True}
)

def test_user_scenario(username, risk_score, scenario_name):
    print(f"\n🧪 Scenario: {scenario_name} (Risk: {risk_score})")
    
    # 1. Create User
    user, created = User.objects.get_or_create(username=username, defaults={'email': f'{username}@example.com'})
    
    # 2. Set Risk Score
    # Handle OneToOne relation creation if missing
    if not hasattr(user, 'verification'):
        VerificationStatus.objects.create(user=user, risk_score=risk_score)
    else:
        user.verification.risk_score = risk_score
        user.verification.save()
        
    # 3. Test Permission Logic
    allowed, msg = ProductService.can_user_list_product(user)
    print(f"   Gateway Decision: {'✅ ALLOWED' if allowed else '⛔ BLOCKED'}")
    print(f"   Message: {msg}")
    
    # 4. Test Creation Logic (if allowed)
    if allowed:
        try:
            p = ProductService.create_community_product(user, {
                'name': f"Product by {username}",
                'name_ar': f"منتج {username}",
                'slug': f"p-{username}-{random.randint(10000,99999)}",
                'category': category,
                'price_per_day': 1000,
                'size': 'M',
                'color': 'Black'
            })
            print(f"   Product Created: ID={p.id}")
            print(f"   Community Approved: {'⭐ YES' if p.is_community_approved else '⏳ NO (Under Review)'}")
        except Exception as e:
            print(f"   ❌ Creation Error: {e}")

# Run Scenarios
test_user_scenario('trusted_user', 20, "Community Hero (Low Risk)")
test_user_scenario('new_user', 50, "Average Joe (Medium Risk)")
test_user_scenario('risky_user', 90, "Bad Actor (High Risk)")

print("\n-------------------------------------")
