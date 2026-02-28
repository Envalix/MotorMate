'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRegister, initiateGoogleLogin } from '@/hooks/use-auth';
import type { AxiosError } from 'axios';

// ─── Email sent state ─────────────────────────────────────────────────────────
function CheckEmailPrompt({ email }: { email: string }) {
  return (
    <div className="w-full max-w-md text-center">
      <div className="inline-flex items-center gap-2 mb-6">
        <span className="text-2xl">🚗</span>
        <span className="text-xl font-semibold tracking-tight text-zinc-900">MotorMate</span>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
          <svg className="h-7 w-7 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">Check your email</h2>
        <p className="text-sm text-zinc-500 max-w-xs">
          We sent a verification link to <span className="font-medium text-zinc-700">{email}</span>.
          Open it to activate your account.
        </p>
        <p className="text-xs text-zinc-400 mt-2">The link expires in 24 hours.</p>
        <Link
          href="/login"
          className="mt-4 text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

// ─── Google logo SVG ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const register = useRegister();

  const serverError = register.error
    ? ((register.error as AxiosError<{ message: string }>).response?.data?.message ??
      'Something went wrong. Please try again.')
    : null;

  const errorMessage = clientError ?? serverError;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClientError(null);

    if (!name.trim()) {
      setClientError('Please enter your name.');
      return;
    }
    if (password.length < 8) {
      setClientError('Password must be at least 8 characters.');
      return;
    }

    register.mutate({ name: name.trim(), email, password });
  }

  // Registration successful — prompt user to verify email
  if (register.isSuccess) {
    return <CheckEmailPrompt email={email} />;
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="text-2xl">🚗</span>
          <span className="text-xl font-semibold tracking-tight text-zinc-900">MotorMate</span>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">Start managing your vehicle inventory today</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row">

          {/* ── Left column: Google OAuth ── */}
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 sm:p-10">
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">Continue with Google</p>
              <p className="mt-1 text-xs text-zinc-400">
                No password needed — use your Google account
              </p>
            </div>

            <button
              type="button"
              onClick={initiateGoogleLogin}
              className="flex w-full max-w-[220px] items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 active:bg-zinc-100"
            >
              <GoogleIcon />
              Sign up with Google
            </button>

            <p className="text-xs text-zinc-400">
              Already have an account?{' '}
              <Link href="/login" className="text-zinc-600 underline underline-offset-2 hover:text-zinc-900">
                Sign in
              </Link>
            </p>
          </div>

          {/* ── Divider: horizontal on mobile, vertical on sm+ ── */}
          <div className="relative flex flex-row sm:flex-col items-center justify-center h-px sm:h-auto w-full sm:w-px bg-zinc-100 shrink-0">
            <span className="absolute bg-white px-1.5 py-1 text-xs font-medium text-zinc-400 select-none">
              or
            </span>
          </div>

          {/* ── Right column: email/password form ── */}
          <div className="flex flex-1 flex-col justify-center p-8 sm:p-10">
            <p className="mb-6 text-sm font-medium text-zinc-700">Sign up with email</p>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-medium text-zinc-600">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none ring-0 transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200"
                />
              </div>

              {/* Email */}
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
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none ring-0 transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-medium text-zinc-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={register.isPending}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {register.isPending ? (
                  <>
                    <Spinner /> Creating account…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
