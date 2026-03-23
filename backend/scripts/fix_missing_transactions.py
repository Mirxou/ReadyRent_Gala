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

def run_fix():
    print("--------------------------------------------------")
    print("🔧 WALLET TRANSACTION BACKFILL (FIX)")
    print("--------------------------------------------------")
    
    fixed_count = 0
    
    for wallet in Wallet.objects.all():
        # Calculate sum of existing transactions
        tx_sum = WalletTransaction.objects.filter(wallet=wallet).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        # Check for Mismatch
        diff = wallet.balance - tx_sum
        
        if diff != 0:
            print(f"⚠️  Wallet #{wallet.id} Mismatch: Bal={wallet.balance}, TxSum={tx_sum}, Diff={diff}")
            
            # If positive difference, we treat it as an unrecorded initial deposit
            # If negative difference, we treat it as an unrecorded withdrawal (or corruption)
            
            # For this simulation cleanup, we assume it's the "Genesis Deposit" missing
            
            print(f"   🛠️  Creating 'administrative_adjustment' transaction for {diff}...")
            
            WalletTransaction.objects.create(
                wallet=wallet,
                amount=diff,
                balance_after=wallet.balance, # The balance is already correct in the wallet model
                transaction_type='deposit', # Using deposit for positive/negative adjustment for simplicity or 'penalty'
                description='AUDIT ADJUSTMENT: Missing History Backfill',
                reference_id='AUDIT_FIX_001'
            )
            fixed_count += 1
            print("   ✅ Fixed.")
        else:
            print(f"   OK Wallet #{wallet.id}")

    print(f"\n✨ Completed. Fixed {fixed_count} wallets.")

if __name__ == "__main__":
    run_fix()
