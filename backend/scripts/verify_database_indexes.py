"""
Phase 24 Step 2: Database Index Verification Script

Verifies that all strategic indexes have been created successfully
for Judgment and EvidenceLog models.
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

def verify_indexes():
    """Verify that all indexes were created successfully"""
    
    print("=" * 70)
    print("DATABASE INDEX VERIFICATION")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # Check Judgment indexes
        print("\n📊 Checking Judgment Indexes...")
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'disputes_judgment'
            ORDER BY indexname
        """)
        judgment_indexes = cursor.fetchall()
        
        print(f"  Found {len(judgment_indexes)} indexes:")
        for idx in judgment_indexes:
            print(f"    - {idx[0]}")
        
        
        # Verify expected indexes exist (check for exact names from migration)
        judgment_index_names = [idx[0] for idx in judgment_indexes]
        
        # The 3 new indexes we created:
        # disputes_ju_dispute_2c248e_idx = dispute + status
        # disputes_ju_dispute_588ac4_idx = dispute + created_at  
        # disputes_ju_status_884655_idx = status + finalized_at
        
        found_dispute_status = any('disputes_ju_dispute_2c248e' in idx for idx in judgment_index_names)
        found_dispute_created = any('disputes_ju_dispute_588ac4' in idx for idx in judgment_index_names)
        found_status_finalized = any('disputes_ju_status_884655' in idx for idx in judgment_index_names)
        
        judgment_ok = found_dispute_status and found_dispute_created and found_status_finalized
        
        if judgment_ok:
            print("  ✅ All Judgment indexes verified!")
        else:
            print("  ❌ Missing some Judgment indexes")
            if not found_dispute_status:
                print("    - Missing: disputes_ju_dispute_2c248e_idx (dispute + status)")
            if not found_dispute_created:
                print("    - Missing: disputes_ju_dispute_588ac4_idx (dispute + created_at)")
            if not found_status_finalized:
                print("    - Missing: disputes_ju_status_884655_idx (status + finalized_at)")
        
        # Check EvidenceLog indexes
        print("\n📊 Checking EvidenceLog Indexes...")
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'disputes_evidencelog'
            ORDER BY indexname
        """)
        evidence_indexes = cursor.fetchall()
        
        print(f"  Found {len(evidence_indexes)} indexes:")
        for idx in evidence_indexes:
            print(f"    - {idx[0]}")
        
        
        # Verify expected indexes exist (check for exact names from migration)
        evidence_index_names = [idx[0] for idx in evidence_indexes]
        
        # The 3 new indexes we created:
        # disputes_ev_booking_0d07bc_idx = booking + timestamp
        # disputes_ev_dispute_9b9386_idx = dispute + timestamp
        # disputes_ev_action_34c5e2_idx = action + timestamp
        
        found_booking = any('disputes_ev_booking_0d07bc' in idx for idx in evidence_index_names)
        found_dispute = any('disputes_ev_dispute_9b9386' in idx for idx in evidence_index_names)
        found_action = any('disputes_ev_action_34c5e2' in idx for idx in evidence_index_names)
        
        evidence_ok = found_booking and found_dispute and found_action
        
        if evidence_ok:
            print("  ✅ All EvidenceLog indexes verified!")
        else:
            print("  ❌ Missing some EvidenceLog indexes")
            if not found_booking:
                print("    - Missing: disputes_ev_booking_0d07bc_idx (booking + timestamp)")
            if not found_dispute:
                print("    - Missing: disputes_ev_dispute_9b9386_idx (dispute + timestamp)")
            if not found_action:
                print("    - Missing: disputes_ev_action_34c5e2_idx (action + timestamp)")
    
    print("\n" + "="*70)
    if judgment_ok and evidence_ok:
        print("✅ VERIFICATION PASSED - All 6 indexes created successfully")
        print("="*70)
        return True
    else:
        print("❌ VERIFICATION FAILED - Some indexes are missing")
        print("="*70)
        return False

if __name__ == '__main__':
    success = verify_indexes()
    sys.exit(0 if success else 1)
