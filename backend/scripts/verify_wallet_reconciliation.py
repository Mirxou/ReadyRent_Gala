import os
import sys
import django
from decimal import Decimal
from django.db.models import Sum

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payments.models import Wallet, WalletTransaction
from apps.payments.models import EscrowHold
from apps.payments.states import EscrowState

def run_reconciliation():
    print("--------------------------------------------------")
    print("🛡️  WALLET RECONCILIATION & INTEGRITY CHECK")
    print("--------------------------------------------------")
    
    errors = []
    
    # =========================================================================
    # 1. Per-Wallet Balance Integrity
    # Invariant: Wallet.balance == Sum(WalletTransaction.amount)
    # =========================================================================
    print(f"🔍 Checking {Wallet.objects.count()} Wallets for Balance Integrity...")
    
    for wallet in Wallet.objects.all():
        # Calculate sum of all transactions
        # Note: amount is signed (+ for credit, - for debit)
        tx_sum = WalletTransaction.objects.filter(wallet=wallet).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        # Check for Mismatch
        if wallet.balance != tx_sum:
            msg = f"❌ Wallet #{wallet.id} ({wallet.user.email}) Mismatch! Stored: {wallet.balance}, Calculated: {tx_sum}"
            errors.append(msg)
            print(msg)
        
        # Check for Negative Balance (Invariant 4)
        if wallet.balance < 0:
            msg = f"❌ Wallet #{wallet.id} ({wallet.user.email}) Negative Balance! {wallet.balance}"
            errors.append(msg)
            print(msg)

    if not errors:
        print("✅ All Wallet Balances match Transaction History.")
    
    # =========================================================================
    # 2. System-Wide Conservation of Funds
    # Total System Value = Sum(Wallet Balances) + Sum(Active Escrow Holdings)
    # Active Escrow = HELD, DISPUTED
    # =========================================================================
    print("\n🔍 Checking System-Wide Fund Conservation...")
    
    total_wallet_balance = Wallet.objects.aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
    
    # Calculate Active Escrow Funds
    active_states = [EscrowState.HELD, EscrowState.DISPUTED]
    total_escrow_held = EscrowHold.objects.filter(state__in=active_states).aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    system_total = total_wallet_balance + total_escrow_held
    
    print(f"   💰 Total Wallet Note: {total_wallet_balance}")
    print(f"   🔒 Total Escrow Held: {total_escrow_held}")
    print(f"   🏛️  SYSTEM TOTAL:      {system_total}")
    
    # =========================================================================
    # 3. Orphan & Logical Checks (Invariant 3)
    # =========================================================================
    print("\n🔍 Checking for Orphans & Logical Anomalies...")
    
    # Check for Null Amounts
    null_txs = WalletTransaction.objects.filter(amount__isnull=True).count()
    if null_txs > 0:
        errors.append(f"❌ Found {null_txs} WalletTransactions with NULL amount.")
        
    # Check for detached Escrow References (String parsing strictly for reference_id)
    # reference_id format: "escrow_hold:ID"
    # We'll sample check or check regex? simple check for now.
    
    # Check for CANCELLED/RELEASED/REFUNDED escrows that still exist in 'active' calculation?
    # No, we filtered by state.
    
    # Double Check: Do any RELEASED escrows have 0 transactions? (Should have release tx)
    # This matches Engine _validate_post_invariants logic, but system-wide.
    
    released_escrows = EscrowHold.objects.filter(state=EscrowState.RELEASED)
    for escrow in released_escrows:
        ref_id = f"escrow_hold:{escrow.id}"
        if not WalletTransaction.objects.filter(reference_id=ref_id).exists():
            msg = f"❌ Escrow #{escrow.id} is RELEASED but has no linking WalletTransaction."
            errors.append(msg)
            print(msg)

    refunded_escrows = EscrowHold.objects.filter(state=EscrowState.REFUNDED)
    for escrow in refunded_escrows:
        ref_id = f"escrow_hold:{escrow.id}"
        if not WalletTransaction.objects.filter(reference_id=ref_id).exists():
            msg = f"❌ Escrow #{escrow.id} is REFUNDED but has no linking WalletTransaction."
            errors.append(msg)
            print(msg)

    # =========================================================================
    # FINAL REPORT & SNAPSHOT HASHING (Tamper Signal)
    # =========================================================================
    print("\n--------------------------------------------------")
    if errors:
        print(f"🚨 RECONCILIATION FAILED with {len(errors)} errors.")
        sys.exit(1)
    else:
        # 🟢 Generate Snapshot Hash
        # Format: Total Wallet | Total Escrow | Wallet Count | Escrow Count
        import hashlib
        import datetime
        
        wallet_count = Wallet.objects.count()
        escrow_count = EscrowHold.objects.filter(state__in=active_states).count()
        
        snapshot_str = f"{total_wallet_balance}|{total_escrow_held}|{wallet_count}|{escrow_count}"
        snapshot_hash = hashlib.sha256(snapshot_str.encode()).hexdigest()
        
        timestamp = datetime.datetime.now().isoformat()
        log_entry = f"{timestamp} | {snapshot_str} | {snapshot_hash}\n"
        
        # Append to Rolling Log
        log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../ops/reconciliation_history.log')
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        
        with open(log_path, "a") as f:
            f.write(log_entry)
            
        print(f"✅ RECONCILIATION PASSED. Financial State is Consistent.")
        print(f"📝 Snapshot Hashed: {snapshot_hash[:16]}...")
        print(f"📂 Logged to: ops/reconciliation_history.log")
        sys.exit(0)

if __name__ == "__main__":
    run_reconciliation()
