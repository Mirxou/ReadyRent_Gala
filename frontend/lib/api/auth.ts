import { sovereignClient } from './sovereign-client';
import { SovereignResponse } from '@/types/sovereign';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  avatar_url?: string;
  phone_number?: string;
}

export interface AuthResponse {
  user: User;
  access?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    sovereignClient.post<AuthResponse>('/users/login/', { email, password }),
  
  register: (data: any) => 
    sovereignClient.post<AuthResponse>('/users/register/', data),
  
  logout: () => 
    sovereignClient.post<void>('/users/logout/'),
  
  getProfile: () => 
    sovereignClient.get<User>('/users/profile/'),
  
  passwordResetRequest: (email: string) => 
    sovereignClient.post<void>('/users/password-reset/', { email }),
  
  passwordResetConfirm: (data: any) => 
    sovereignClient.post<void>('/users/password-reset/confirm/', data),
};

export const verificationApi = {
  requestPhoneVerification: (phone: string) => 
    sovereignClient.post<void>('/users/verify-phone/request/', { phone }),
  
  verifyPhone: (code: string) => 
    sovereignClient.post<void>('/users/verify-phone/confirm/', { code }),
  
  uploadID: (formData: FormData) => 
    sovereignClient.request<void>('/users/verify-id/', {
      method: 'POST',
      body: formData,
      // Note: fetch automatically sets content-type for FormData if headers are omitted or partially set
      headers: {}, 
    }),
  
  verifyAddress: (data: any) => 
    sovereignClient.post<void>('/users/verify-address/', data),
};
