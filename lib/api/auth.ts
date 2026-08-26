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

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  uid: string;
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export const authApi = {
  login: (data: LoginData) =>
    sovereignClient.post<AuthResponse>('/users/login/', data),
  
  register: (data: RegisterData) => 
    sovereignClient.post<AuthResponse>('/users/register/', data),
  
  logout: () => 
    sovereignClient.post<void>('/users/logout/'),

  getProfile: () => 
    sovereignClient.get<User>('/users/profile/'),
  
  passwordResetRequest: (data: PasswordResetRequest) => 
    sovereignClient.post<void>('/users/password-reset/', data),
  
  passwordResetConfirm: (data: PasswordResetConfirm) => 
    sovereignClient.post<void>('/users/password-reset/confirm/', data),
};

export interface VerificationData {
  phone?: string;
  code?: string;
}

export const verificationApi = {
  requestPhoneVerification: (phone: string) => 
    sovereignClient.post<void>('/users/verify-phone/request/', { phone }),
  
  verifyPhone: (code: string) => 
    sovereignClient.post<void>('/users/verify-phone/confirm/', { code }),

  uploadID: (formData: FormData) => 
    sovereignClient.request<void>('/users/verify-id/', {
      method: 'POST',
      body: formData,
      headers: {}, 
    }),
  
  verifyAddress: (data: any) => 
    sovereignClient.post<void>('/users/verify-address/', data),
};
