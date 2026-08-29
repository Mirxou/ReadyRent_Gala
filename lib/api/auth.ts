import { sovereignClient } from './sovereign-client';

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

  /** Alias used by store.ts, dashboard/page, dashboard/analytics */
  me: () => 
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
  
  verifyAddress: (data: unknown) => 
    sovereignClient.post<void>('/users/verify-address/', data),

  /** Get current verification status (used by use-verification.ts) */
  getStatus: () =>
    sovereignClient.get<unknown>('/users/verification/status/'),

  /** Submit verification with captured photo (used by use-verification.ts) */
  submit: (photo: string) =>
    sovereignClient.post<unknown>('/users/verification/submit/', { photo }),

  /** Get pending verification requests for community voting (used by use-verification.ts) */
  getPending: () =>
    sovereignClient.get<unknown[]>('/users/verification/pending/'),

  /** Vote on a community verification request (used by use-verification.ts) */
  vote: (verificationId: number, vote: string, comment?: string) =>
    sovereignClient.post<unknown>(`/users/verification/${verificationId}/vote/`, { vote, comment })
};
