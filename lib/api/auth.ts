import { sovereignClient } from './sovereign-client';

export interface User {
  id: string;
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
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export const authApi = {
  login: (data: LoginData) =>
    sovereignClient.post<AuthResponse>('/auth/login/', data),

  register: (data: RegisterData) =>
    sovereignClient.post<AuthResponse>('/auth/register/', data),

  logout: () =>
    sovereignClient.post<void>('/auth/logout/'),

  getProfile: () =>
    sovereignClient.get<User>('/auth/profile/'),

  /** Alias used by store.ts, dashboard/page, dashboard/analytics */
  me: () =>
    sovereignClient.get<User>('/auth/profile/'),

  passwordResetRequest: (data: PasswordResetRequest) =>
    sovereignClient.post<void>('/auth/forgot-password/', data),

  passwordResetConfirm: (data: PasswordResetConfirm) =>
    sovereignClient.post<void>('/auth/reset-password/', data),
};

export const verificationApi = {
  // TODO: route not yet implemented — /verification/phone/request
  // requestPhoneVerification: (phone: string) =>
  //   sovereignClient.post<void>('/verification/phone/request/', { phone }),

  // TODO: route not yet implemented — /verification/phone/confirm
  // verifyPhone: (code: string) =>
  //   sovereignClient.post<void>('/verification/phone/confirm/', { code }),

  // TODO: route not yet implemented — /verification/id
  // uploadID: (formData: FormData) =>
  //   sovereignClient.request<void>('/verification/id/', {
  //     method: 'POST',
  //     body: formData,
  //     headers: {},
  //   }),

  // TODO: route not yet implemented — /verification/address
  // verifyAddress: (data: unknown) =>
  //   sovereignClient.post<void>('/verification/address/', data),

  /** Get current verification status (used by use-verification.ts) */
  getStatus: () =>
    sovereignClient.get<unknown>('/verification/status/'),

  /** Submit verification with captured photo (used by use-verification.ts) */
  submit: (photo: string) =>
    sovereignClient.post<unknown>('/verification/submit/', { photo }),

  /** Get pending verification requests for community voting (used by use-verification.ts) */
  getPending: () =>
    sovereignClient.get<unknown[]>('/verification/pending/'),

  /** Vote on a community verification request (used by use-verification.ts) */
  vote: (verificationId: string, vote: string, comment?: string) =>
    sovereignClient.post<unknown>('/verification/vote/', { verification_id: verificationId, vote, comment }),
};
