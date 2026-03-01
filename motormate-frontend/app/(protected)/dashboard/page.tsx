'use client';

import Link from 'next/link';
import { useVehicles } from '@/hooks/use-vehicles';
import { useMe } from '@/hooks/use-auth';
import type { Vehicle } from '@/types';

function daysInStock(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
}

function formatLKR(amount: string | number | null | undefined) {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `LKR ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-zinc-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: user } = useMe();
  const { data: vehicles = [], isLoading } = useVehicles();

  const inStock = vehicles.filter((v) => v.status === 'IN_STOCK');
  const reserved = vehicles.filter((v) => v.status === 'RESERVED');
  const sold = vehicles.filter((v) => v.status === 'SOLD');

  const totalInvestment = vehicles.reduce(
    (sum, v) => sum + parseFloat(v.purchasePrice),
    0,
  );

  const recentVehicles = vehicles.slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">
          {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">Here&apos;s your inventory overview</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Vehicles" value={vehicles.length} />
          <StatCard label="In Stock" value={inStock.length} sub="available" />
          <StatCard label="Reserved" value={reserved.length} sub="pending sale" />
          <StatCard label="Sold" value={sold.length} sub="this account" />
        </div>
      )}

      {/* Investment */}
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-medium text-zinc-500">Total Investment (In Stock + Reserved)</p>
        <p className="mt-1 text-2xl font-bold text-zinc-900">
          {isLoading ? '…' : formatLKR(
            vehicles
              .filter((v) => v.status !== 'SOLD')
              .reduce((s, v) => s + parseFloat(v.purchasePrice), 0),
          )}
        </p>
      </div>

      {/* Recent vehicles */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Recent Vehicles</h2>
          <Link href="/vehicles" className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : recentVehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center">
            <p className="text-sm text-zinc-500">No vehicles yet.</p>
            <Link
              href="/vehicles/new"
              className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Add your first vehicle
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentVehicles.map((v) => (
              <VehicleRow key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleRow({ vehicle: v }: { vehicle: Vehicle }) {
  const thumb = v.images?.[0]?.url;
  const days = daysInStock(v.createdAt);

  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
    >
      {thumb ? (
        <img src={thumb} alt="" className="h-12 w-16 rounded-lg object-cover" />
      ) : (
        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-zinc-100">
          <span className="text-xl">🚗</span>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-zinc-900">
          {v.year} {v.make} {v.model}
        </p>
        <p className="text-xs text-zinc-500">{v.plateNumber ?? v.vin ?? '—'} · {days}d in stock</p>
      </div>
      <StatusBadge status={v.status} />
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    IN_STOCK: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    RESERVED: 'bg-amber-50 text-amber-700 ring-amber-200',
    SOLD: 'bg-zinc-100 text-zinc-500 ring-zinc-200',
  };
  const label: Record<string, string> = {
    IN_STOCK: 'In Stock',
    RESERVED: 'Reserved',
    SOLD: 'Sold',
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${map[status] ?? 'bg-zinc-100 text-zinc-500 ring-zinc-200'}`}>
      {label[status] ?? status}
    </span>
  );
}
