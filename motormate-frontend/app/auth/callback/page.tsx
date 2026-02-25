'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveToken } from '@/hooks/use-auth';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-50">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800" />
      <p className="text-sm text-zinc-500">Signing you in…</p>
    </div>
  </div>
);

/**
 * Inner component that reads search params.
 * Must be wrapped in <Suspense> because useSearchParams() opts out of SSR.
 */
function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      saveToken(token);
      router.replace('/dashboard');
    } else {
      // No token — something went wrong; send back to login
      router.replace('/login?error=oauth_failed');
    }
  }, [params, router]);

  return <Spinner />;
}

/**
 * Landing page for the Google OAuth redirect.
 * The backend sends: GET /auth/callback?token=<jwt>
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackHandler />
    </Suspense>
  );
}
