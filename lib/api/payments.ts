import { sovereignClient } from './sovereign-client';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'baridimob' | 'bank_transfer';
  icon?: string;
}

export const paymentsApi = {
  getMethods: () => 
    sovereignClient.get<PaymentMethod[]>('/payments/methods/'),

  /** Create a payment — flexible params (used by bank-card-form, baridimob-form) */
  create: (data: { booking_id?: number | string; payment_method?: string; amount?: number; [key: string]: any }) => 
    sovereignClient.post<any>('/payments/create/', data),

  /** Create a payment — strict params (alias) */
  createPayment: (bookingId: number, methodId: string) => 
    sovereignClient.post<any>('/payments/create/', { 
      booking_id: bookingId, 
      payment_method: methodId 
    }),

  getStatus: (paymentId: string) => 
    sovereignClient.get<{ status: string }>(`/payments/${paymentId}/status/`),

  verifyOtp: (paymentIdOrData: string | { paymentId: string; otp: string }, otpCode?: string) => {
    const paymentId = typeof paymentIdOrData === 'string' 
      ? paymentIdOrData 
      : paymentIdOrData.paymentId;
    const otp = typeof paymentIdOrData === 'string' 
      ? otpCode! 
      : paymentIdOrData.otp;
    return sovereignClient.post<any>(`/payments/${paymentId}/verify_otp/`, { otp_code: otp });
  },

  getAll: () => sovereignClient.get<any>('/payments/'),
};
