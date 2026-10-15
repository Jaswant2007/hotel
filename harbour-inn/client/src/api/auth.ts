import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  emailVerifiedAt: string | null;
  status?: string;
}

export interface SessionRecord {
  id: string;
  family_id: string;
  ip: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
}

export interface Booking {
  id: string;
  roomTitle: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  canCancel: boolean;
}

export const authApi = {
  requestOtp: (data: {
    email: string;
    purpose: 'signup' | 'login';
    name?: string;
    phone?: string;
    consent?: boolean;
  }) =>
    apiClient<{
      code: string;
      message: string;
      emailMasked: string;
      expiresAt: string;
      cooldownSeconds: number;
    }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyOtp: (data: { email: string; code: string; purpose: 'signup' | 'login' }) =>
    apiClient<{
      code: string;
      message: string;
      user: User;
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendOtp: (data: { email: string; purpose: 'signup' | 'login' }) =>
    apiClient<{
      code: string;
      message: string;
      emailMasked: string;
      expiresAt: string;
      cooldownSeconds: number;
    }>('/auth/otp/resend', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refresh: () =>
    apiClient<{ code: string; message: string }>('/auth/refresh', {
      method: 'POST',
    }),

  logout: () =>
    apiClient<{ code: string; message: string }>('/auth/logout', {
      method: 'POST',
    }),

  logoutAll: () =>
    apiClient<{ code: string; message: string }>('/auth/logout-all', {
      method: 'POST',
    }),

  getMe: () =>
    apiClient<{ code: string; user: User }>('/me'),

  updateMe: (data: { name?: string; phone?: string }) =>
    apiClient<{ code: string; user: User; message: string }>('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getSessions: () =>
    apiClient<{ code: string; sessions: SessionRecord[] }>('/me/sessions'),

  revokeSession: (id: string) =>
    apiClient<{ code: string; message: string }>(`/me/sessions/${id}`, {
      method: 'DELETE',
    }),

  getBookings: () =>
    apiClient<{ code: string; bookings: Booking[] }>('/me/bookings'),

  deleteAccount: () =>
    apiClient<{ code: string; message: string }>('/me', {
      method: 'DELETE',
    }),
};
