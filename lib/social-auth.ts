// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Social Auth / Phone Verification
// Google OAuth + Phone (SMS) verification stubs for production integration
// ═══════════════════════════════════════════════════════════════

// ──── Types ────

export interface SocialAuthUser {
  email: string;
  name: string;
  avatar?: string;
  provider: string;
  providerId: string;
}

export interface SocialAuthResult {
  success: boolean;
  user?: SocialAuthUser;
  error?: string;
}

// ──── Google OAuth ────
// Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// Production: exchange code for tokens, fetch Google user profile

export async function googleAuth(code: string): Promise<SocialAuthResult> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('[AUTH] Google OAuth not configured');
    return { success: false, error: 'GOOGLE_NOT_CONFIGURED' };
  }

  // ── Future integration steps ──
  // 1. Exchange authorization code for access token:
  //    POST https://oauth2.googleapis.com/token
  //    body: code, client_id, client_secret, redirect_uri, grant_type=authorization_code
  // 2. Fetch user profile:
  //    GET https://www.googleapis.com/oauth2/v2/userinfo
  //    Authorization: Bearer <access_token>
  // 3. Return user info

  console.warn('[AUTH] Google OAuth not fully integrated — received code:', code.slice(0, 8) + '...');
  return { success: false, error: 'GOOGLE_NOT_CONFIGURED' };
}

// ──── Phone Verification ────
// Requires: SMS provider (Twilio, Vonage, or local gateway)

export async function sendPhoneVerification(phone: string): Promise<{ success: boolean; messageId?: string }> {
  if (!process.env.SMS_PROVIDER || !process.env.SMS_API_KEY) {
    console.warn('[AUTH] Phone verification not configured for:', phone);
    return { success: false };
  }

  // ── Future integration steps ──
  // 1. Generate random 6-digit code
  // 2. Store code in DB or cache with expiry (e.g., 5 min)
  // 3. Send SMS via configured provider
  // 4. Return messageId for tracking

  console.warn('[AUTH] Phone verification not fully integrated — phone:', phone);
  return { success: false };
}

export async function verifyPhoneCode(phone: string, code: string): Promise<{ success: boolean }> {
  if (!process.env.SMS_PROVIDER || !process.env.SMS_API_KEY) {
    console.warn('[AUTH] Phone verification not configured');
    return { success: false };
  }

  // ── Future integration steps ──
  // 1. Look up stored code for phone number
  // 2. Check expiry
  // 3. Compare codes (constant-time)
  // 4. Mark phone as verified in user record

  console.warn('[AUTH] Phone verification not fully integrated — phone:', phone);
  void code; // suppress unused warning in stub
  return { success: false };
}
