import { authApi } from '@/lib/api/auth';
import { productsApi } from '@/lib/api/products';
import { bookingsApi } from '@/lib/api/bookings';
import { walletApi } from '@/lib/api/wallet';
import { disputesApi } from '@/lib/api/disputes';
import { sovereignClient } from '@/lib/api/sovereign-client';

/**
 * ⚖️ SOVEREIGN API INTEGRITY AUDIT (Phase 3 Final)
 * -----------------------------------------------
 * This script verifies the unified API layer's structural and logic integrity.
 */
async function runAudit() {
  console.log("🛡️ Initializing CTO-Level API Audit...");

  const results = {
    engine: false,
    public: false,
    auth: false,
    financials: false,
    judicial: false
  };

  try {
    // 1. Engine Check (System Halt Support)
    console.log("🔍 Checking Sovereign Engine...");
    const status = await sovereignClient.get('/system/status/');
    results.engine = (status.status === 'success' || status.status === 'sovereign_halt');
    console.log(`   - Engine Status: ${status.status}`);

    // 2. Public Marketplace Check
    console.log("🔍 Checking Marketplace APIs...");
    const products = await productsApi.search('', {});
    results.public = Array.isArray(products.data);
    console.log(`   - Products found: ${Array.isArray(products.data) ? products.data.length : 'Fail'}`);

    // 3. Auth Integrity Check (Profile access requires valid session/cookie)
    console.log("🔍 Checking Auth Gateway...");
    const profile = await authApi.getProfile();
    results.auth = (profile.status !== 'error');
    console.log(`   - Auth session: ${profile.status}`);

    // 4. Financial Consistency (No mocks allowed)
    console.log("🔍 Checking Financial APIs (Escrow/Wallet)...");
    const balance = await walletApi.getBalance();
    results.financials = (balance.status === 'success' && balance.data.currency === 'SAR');
    console.log(`   - Wallet Balance: ${balance.data?.available || 0} ${balance.data?.currency || ''}`);

    // 5. Judicial System Admissibility
    console.log("🔍 Checking Judicial System Connectivity...");
    const disputes = await disputesApi.listDisputes();
    results.judicial = Array.isArray(disputes.data);
    console.log(`   - Active Disputes tracked: ${Array.isArray(disputes.data) ? disputes.data.length : 'Fail'}`);

    console.log("\n📊 AUDIT SUMMARY:");
    console.log(`   Engine:     ${results.engine ? '✅' : '❌'}`);
    console.log(`   Market:     ${results.public ? '✅' : '❌'}`);
    console.log(`   Auth:       ${results.auth ? '✅' : '❌'}`);
    console.log(`   Financials: ${results.financials ? '✅' : '❌'}`);
    console.log(`   Judicial:   ${results.judicial ? '✅' : '❌'}`);

    const total = Object.values(results).filter(Boolean).length;
    console.log(`\n🏆 API Readiness: ${(total / 5) * 100}%`);

  } catch (err) {
    console.error("❌ CRITICAL AUDIT FAILURE:", err);
  }
}

// In Next.js/Browser context, we'd run this via a dedicated debug page or test suite.
// For manual execution: 
// npx ts-node -r tsconfig-paths/register frontend/scripts/verify_api.ts
