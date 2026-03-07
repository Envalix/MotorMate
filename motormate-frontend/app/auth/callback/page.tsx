'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page is no longer used for Google OAuth.
 * next-auth handles the OAuth callback at /api/auth/callback/google.
 * This page exists only as a fallback redirect.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800" />
        <p className="text-sm text-zinc-500">Signing you in…</p>
      </div>
    </div>
  );
}
