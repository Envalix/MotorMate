'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForgotPassword } from '@/hooks/use-auth';
import type { AxiosError } from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const mutation = useForgotPassword();

  const errorMessage = mutation.error
    ? ((mutation.error as AxiosError<{ message: string }>).response?.data?.message ??
      'Something went wrong. Please try again.')
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ email });
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="text-2xl">🚗</span>
          <span className="text-xl font-semibold tracking-tight text-zinc-900">MotorMate</span>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">Forgot your password?</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
        {mutation.isSuccess ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-2xl">
              ✉️
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">Check your inbox</p>
              <p className="mt-1 text-sm text-zinc-500">
                If <span className="font-medium text-zinc-700">{email}</span> is registered,
                you&apos;ll receive a reset link within a few minutes.
              </p>
            </div>
            <Link
              href="/login"
              className="mt-2 text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {errorMessage && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-zinc-600">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : null}
              {mutation.isPending ? 'Sending…' : 'Send reset link'}
            </button>

            <p className="text-center text-xs text-zinc-400">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
