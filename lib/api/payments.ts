import { sovereignClient } from './sovereign-client';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'baridimob' | 'bank_transfer';
  display_name?: string;
  description?: string;
  icon?: string;
  available?: boolean;
}

export const paymentsApi = {
  getMethods: () => 
    sovereignClient.get<PaymentMethod[]>('/payments/methods/'),

  /** Create a payment — flexible params (used by baridimob-form, booking-wizard) */
  create: (data: { booking_id?: number | string; payment_method?: string; amount?: number; [key: string]: unknown }) => 
    sovereignClient.post<unknown>('/payments/create/', data),

  getStatus: (paymentId: string) => 
    sovereignClient.get<{ status: string }>(`/payments/${paymentId}/status/`),

  verifyOtp: (paymentIdOrData: string | { paymentId: string; otp: string }, otpCode?: string) => {
    const paymentId = typeof paymentIdOrData === 'string' 
      ? paymentIdOrData 
      : paymentIdOrData.paymentId;
    const otp = typeof paymentIdOrData === 'string' 
      ? otpCode! 
      : paymentIdOrData.otp;
    return sovereignClient.post<unknown>(`/payments/${paymentId}/verify_otp/`, { otp_code: otp });
  },

  getAll: () => sovereignClient.get<unknown>('/payments/payments/'),
};
