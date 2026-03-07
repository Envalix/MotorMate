'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useVehicles } from '@/hooks/use-vehicles';
import type { Vehicle, VehicleStatus } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysInStock(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
}

function formatLKR(amount: string | number | null | undefined) {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `LKR ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VehicleStatus }) {
  const map: Record<VehicleStatus, string> = {
    IN_STOCK: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    RESERVED: 'bg-amber-50 text-amber-700 ring-amber-200',
    SOLD: 'bg-zinc-100 text-zinc-500 ring-zinc-200',
  };
  const label: Record<VehicleStatus, string> = {
    IN_STOCK: 'In Stock',
    RESERVED: 'Reserved',
    SOLD: 'Sold',
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${map[status]}`}>
      {label[status]}
    </span>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: VehicleStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'In Stock', value: 'IN_STOCK' },
  { label: 'Reserved', value: 'RESERVED' },
  { label: 'Sold', value: 'SOLD' },
];

// ─── Vehicle card ─────────────────────────────────────────────────────────────

function VehicleCard({ vehicle: v }: { vehicle: Vehicle }) {
  const thumb = v.images?.[0]?.url;
  const days = daysInStock(v.createdAt);

  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-zinc-100">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl">🚗</span>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={v.status} />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[11px] font-medium text-zinc-400">
          {v.plateNumber ?? v.vin ?? 'No plate'}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-zinc-900 group-hover:text-zinc-700">
          {v.year} {v.make} {v.model}
        </p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-zinc-400">Buy price</p>
            <p className="text-sm font-semibold text-zinc-900">{formatLKR(v.purchasePrice)}</p>
          </div>
          <p className="text-[10px] text-zinc-400">{days}d in stock</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const [activeFilter, setActiveFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  function handleSearch(value: string) {
    setSearch(value);
    clearTimeout((handleSearch as { _t?: ReturnType<typeof setTimeout> })._t);
    (handleSearch as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(
      () => setDebouncedSearch(value),
      300,
    );
  }

  const { data: vehicles = [], isLoading } = useVehicles({
    status: activeFilter === 'ALL' ? undefined : activeFilter,
    search: debouncedSearch || undefined,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Vehicles</h1>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
        </svg>
        <input
          type="search"
          placeholder="Search by plate, VIN, make or model…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        />
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === value
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-12 text-center">
          <span className="text-4xl">🚗</span>
          <p className="mt-3 text-sm font-medium text-zinc-600">No vehicles found</p>
          <p className="mt-1 text-xs text-zinc-400">
            {debouncedSearch ? 'Try a different search term' : 'Add your first vehicle to get started'}
          </p>
          {!debouncedSearch && (
            <Link
              href="/vehicles/new"
              className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Add Vehicle
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}

      {/* Floating + button */}
      <Link
        href="/vehicles/new"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6"
        aria-label="Add vehicle"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>
    </div>
  );
}
