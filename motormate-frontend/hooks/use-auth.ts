'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useGet, usePost } from '@/hooks/use-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
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

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export function initiateGoogleLogin() {
  signIn('google', { callbackUrl: '/dashboard' });
}

// ─── Auth mutations ───────────────────────────────────────────────────────────

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });
      if (result?.error) {
        if (result.error === 'email_not_verified') {
          throw new Error('Please verify your email address before logging in');
        }
        throw new Error('Invalid email or password');
      }
    },
    onSuccess() {
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  return usePost<{ message: string }, RegisterCredentials>('/auth/register');
}

export function useVerifyEmail(token: string) {
  return useGet<{ message: string }>(
    ['verify-email', token],
    `/auth/verify-email?token=${token}`,
    { enabled: !!token, retry: false },
  );
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

// ─── Current user ─────────────────────────────────────────────────────────────

export function useMe() {
  const { data: session } = useSession();

  return {
    data: session?.user
      ? ({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.name ?? '',
          avatarUrl: session.user.image ?? null,
        } satisfies AuthUser)
      : undefined,
  };
}

// ─── Legacy helpers (kept for remaining references) ───────────────────────────

/** @deprecated session is managed by next-auth cookies */
export function saveToken(_token: string) {}

/** @deprecated Use signOut() directly */
export function clearToken() {
  signOut({ callbackUrl: '/login' });
}
