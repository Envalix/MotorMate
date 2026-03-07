'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// ─── Car silhouette SVG ──────────────────────────────────────────────────────
function CarSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <path
        d="M20 50 Q20 35 40 35 L60 35 L75 18 Q78 15 82 15 L130 15 Q134 15 136 18 L155 35 L175 35 Q190 35 190 50 L190 55 L20 55 Z"
        fill="currentColor"
      />
      {/* Windshield */}
      <path
        d="M78 33 L90 18 Q92 16 95 16 L125 16 Q128 16 129 18 L145 33 Z"
        fill="rgba(255,255,255,0.15)"
      />
      {/* Headlights */}
      <rect x="180" y="38" width="8" height="6" rx="2" fill="#facc15" opacity="0.9" />
      <rect x="12" y="38" width="8" height="6" rx="2" fill="#ef4444" opacity="0.7" />
      {/* Wheel wells */}
      <rect x="15" y="52" width="40" height="10" rx="5" fill="#09090b" />
      <rect x="145" y="52" width="40" height="10" rx="5" fill="#09090b" />
      {/* Wheels */}
      <circle cx="50" cy="58" r="12" fill="#27272a" stroke="#52525b" strokeWidth="2" />
      <circle cx="50" cy="58" r="5" fill="#3f3f46" />
      <circle cx="160" cy="58" r="12" fill="#27272a" stroke="#52525b" strokeWidth="2" />
      <circle cx="160" cy="58" r="5" fill="#3f3f46" />
      {/* Hub caps */}
      <circle cx="50" cy="58" r="2" fill="#71717a" />
      <circle cx="160" cy="58" r="2" fill="#71717a" />
    </svg>
  );
}

// ─── Road lines ──────────────────────────────────────────────────────────────
function RoadLines() {
  return (
    <div className="absolute bottom-18 left-0 right-0 flex items-center justify-center gap-6 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="h-0.5 w-10 rounded-full bg-zinc-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, delay: 0.8 + i * 0.08, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push('/login'), 3400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(63,63,70,0.25)_0%,transparent_70%)]" />

      {/* Content container */}
      <div className="relative flex flex-col items-center gap-8">

        {/* Car animation */}
        <motion.div
          className="text-zinc-300 w-48 sm:w-64"
          initial={{ x: '-120%', opacity: 0 }}
          animate={{ x: '0%', opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <CarSvg />
        </motion.div>

        <RoadLines />

        {/* Brand name */}
        <motion.h1
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          MotorMate
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-sm text-zinc-500 sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4, ease: 'easeOut' }}
        >
          Your vehicle inventory, simplified.
        </motion.p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900">
        <motion.div
          className="h-full origin-left bg-zinc-600"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 3.2, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
