'use client';

import { useRouter } from 'next/navigation';
import { usePost } from '@/hooks/use-api';

// ─── Shared types ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function saveToken(token: string) {
  localStorage.setItem('access_token', token);
}

export function clearToken() {
  localStorage.removeItem('access_token');
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/** Redirect the browser to the Google OAuth consent screen. */
export function initiateGoogleLogin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
  window.location.href = `${apiUrl}/auth/google`;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useLogin() {
  const router = useRouter();
  return usePost<AuthResponse, LoginCredentials>('/auth/login', {
    onSuccess(data) {
      saveToken(data.accessToken);
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return usePost<AuthResponse, RegisterCredentials>('/auth/register', {
    onSuccess(data) {
      saveToken(data.accessToken);
      router.push('/dashboard');
    },
  });
}

export function useForgotPassword() {
  return usePost<{ message: string }, { email: string }>('/auth/forgot-password');
}

export function useResetPassword() {
  const router = useRouter();
  return usePost<{ message: string }, { token: string; password: string }>(
    '/auth/reset-password',
    {
      onSuccess() {
        router.push('/login?reset=success');
      },
    },
  );
}
