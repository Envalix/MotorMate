'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useVerifyEmail } from '@/hooks/use-auth';

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
  );
}

// ─── Inner component (reads search params) ────────────────────────────────────
function VerifyEmailHandler() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const { isPending, isSuccess, isError } = useVerifyEmail(token);

  // No token in URL
  if (!token) {
    return (
      <StatusCard
        icon="❌"
        title="Invalid link"
        body="This verification link is missing a token. Please check your email and try again."
        action={<BackToLogin />}
      />
    );
  }

  if (isPending) {
    return (
      <StatusCard
        icon={<Spinner />}
        title="Verifying your email…"
        body="Please wait a moment."
      />
    );
  }

  if (isSuccess) {
    return (
      <StatusCard
        icon="✅"
        title="Email verified!"
        body="Your account is now active. You can sign in."
        action={
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Go to sign in
          </Link>
        }
      />
    );
  }

  if (isError) {
    return (
      <StatusCard
        icon="⚠️"
        title="Link invalid or expired"
        body="This verification link has expired or already been used. Register again to get a new link."
        action={
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Register again
            </Link>
            <BackToLogin />
          </div>
        }
      />
    );
  }

  return null;
}

// ─── Shared card ──────────────────────────────────────────────────────────────
function StatusCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md text-center">
      <div className="inline-flex items-center gap-2 mb-6">
        <span className="text-2xl">🚗</span>
        <span className="text-xl font-semibold tracking-tight text-zinc-900">MotorMate</span>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
        <p className="text-sm text-zinc-500 max-w-xs">{body}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

function BackToLogin() {
  return (
    <Link
      href="/login"
      className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
    >
      Back to sign in
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <StatusCard icon={<Spinner />} title="Verifying your email…" body="Please wait a moment." />
      }
    >
      <VerifyEmailHandler />
    </Suspense>
  );
}
