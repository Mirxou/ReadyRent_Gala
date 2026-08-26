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

  createPayment: (bookingId: number, methodId: string) => 
    sovereignClient.post<any>('/payments/create/', { 
      booking_id: bookingId, 
      payment_method: methodId 
    }),

  getStatus: (paymentId: string) => 
    sovereignClient.get<{ status: string }>(`/payments/payments/${paymentId}/status/`),

  verifyOtp: (paymentId: string, otpCode: string) => 
    sovereignClient.post<any>(`/payments/payments/${paymentId}/verify_otp/`, { 
      otp_code: otpCode 
    }),
};
