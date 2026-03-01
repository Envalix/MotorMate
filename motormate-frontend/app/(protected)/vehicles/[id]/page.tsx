'use client';

import { use, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVehicle, useDeleteVehicle, useUpdateVehicle } from '@/hooks/use-vehicles';
import { PhotoManager } from '@/components/vehicles/photo-manager';
import { DocumentManager } from '@/components/vehicles/document-manager';
import { BuyRecordPanel } from '@/components/vehicles/buy-record-panel';
import { ExpenseManager } from '@/components/vehicles/expense-manager';
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
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${map[status]}`}>
      {label[status]}
    </span>
  );
}

// ─── Photo gallery ────────────────────────────────────────────────────────────

function PhotoGallery({ images }: { images: Vehicle['images'] }) {
  // Primary photo first
  const list = [...(images ?? [])].sort((a, b) =>
    a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1,
  );
  const [active, setActive] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  if (list.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-zinc-100">
        <div className="text-center">
          <span className="text-5xl">🚗</span>
          <p className="mt-2 text-xs text-zinc-400">No photos yet</p>
        </div>
      </div>
    );
  }

  function handlePointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX;
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (pointerStartX.current === null) return;
    const delta = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) setActive((i) => Math.min(i + 1, list.length - 1));
    else setActive((i) => Math.max(i - 1, 0));
  }

  return (
    <div>
      <div
        className="overflow-hidden rounded-xl cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <img
          src={list[active].url}
          alt=""
          className="aspect-[4/3] w-full object-cover pointer-events-none"
          draggable={false}
        />
      </div>
      {list.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === active ? 'border-zinc-900' : 'border-transparent'
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Spec row ─────────────────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-900">{value ?? '—'}</span>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Details', 'Photos', 'Documents', 'Expenses', 'Buy Record', 'Sell Record'] as const;
type Tab = typeof TABS[number];

// ─── Status changer ───────────────────────────────────────────────────────────

function StatusChanger({ vehicleId, currentStatus }: { vehicleId: string; currentStatus: VehicleStatus }) {
  const update = useUpdateVehicle(vehicleId);
  const statuses: VehicleStatus[] = ['IN_STOCK', 'RESERVED', 'SOLD'];
  const labels: Record<VehicleStatus, string> = { IN_STOCK: 'In Stock', RESERVED: 'Reserved', SOLD: 'Sold' };

  return (
    <div className="flex gap-2">
      {statuses.map((s) => (
        <button
          key={s}
          disabled={s === currentStatus || update.isPending}
          onClick={() => update.mutate({ status: s } as Parameters<typeof update.mutate>[0])}
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition disabled:cursor-not-allowed ${
            s === currentStatus
              ? 'bg-zinc-900 text-white ring-zinc-900'
              : 'bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-50'
          }`}
        >
          {labels[s]}
        </button>
      ))}
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteButton({ vehicleId }: { vehicleId: string }) {
  const [confirming, setConfirming] = useState(false);
  const del = useDeleteVehicle(vehicleId);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Are you sure?</span>
        <button
          onClick={() => del.mutate()}
          disabled={del.isPending}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {del.isPending ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Details');

  const { data: vehicle, isLoading, isError } = useVehicle(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-sm text-zinc-500">Vehicle not found.</p>
        <Link href="/vehicles" className="mt-4 inline-block text-sm text-zinc-700 underline">
          Back to vehicles
        </Link>
      </div>
    );
  }

  const days = daysInStock(vehicle.createdAt);

  const conditionLabel: Record<string, string> = {
    NEW: 'New', EXCELLENT: 'Excellent', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor',
  };
  const fuelLabel: Record<string, string> = {
    PETROL: 'Petrol', DIESEL: 'Diesel', ELECTRIC: 'Electric', HYBRID: 'Hybrid', OTHER: 'Other',
  };
  const transLabel: Record<string, string> = {
    MANUAL: 'Manual', AUTOMATIC: 'Automatic', CVT: 'CVT', OTHER: 'Other',
  };
  const typeLabel: Record<string, string> = {
    CAR: '🚗 Car', MOTORCYCLE: '🏍️ Motorcycle', SUV: '🚙 SUV',
    VAN: '🚐 Van', TRUCK: '🚛 Truck', BUS: '🚌 Bus', OTHER: '🚘 Other',
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      {/* Back + actions */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
          aria-label="Back"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <Link
            href={`/vehicles/${id}/edit`}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Edit
          </Link>
          <DeleteButton vehicleId={id} />
        </div>
      </div>

      {/* Hero */}
      <div className="mb-4">
        <PhotoGallery images={vehicle.images} />
      </div>

      {/* Title + status */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {vehicle.plateNumber ?? vehicle.vin ?? 'No plate/VIN'} · {days}d in stock
          </p>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>

      {/* Status changer */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-medium text-zinc-500">Change status</p>
        <StatusChanger vehicleId={id} currentStatus={vehicle.status} />
      </div>

      {/* Prices */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Purchase Price</p>
          <p className="mt-0.5 text-base font-bold text-zinc-900">{formatLKR(vehicle.purchasePrice)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Asking Price</p>
          <p className="mt-0.5 text-base font-bold text-zinc-900">{formatLKR(vehicle.sellingPrice)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-zinc-200 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Details' && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2">
          <SpecRow label="Vehicle Type" value={vehicle.vehicleType ? typeLabel[vehicle.vehicleType] : null} />
          <SpecRow label="Make" value={vehicle.make} />
          <SpecRow label="Model" value={vehicle.model} />
          <SpecRow label="Year" value={vehicle.year} />
          <SpecRow label="Plate Number" value={vehicle.plateNumber} />
          <SpecRow label="Chassis / VIN" value={vehicle.vin} />
          <SpecRow label="Colour" value={vehicle.color} />
          <SpecRow label="Engine CC" value={vehicle.engineCC ? `${vehicle.engineCC} cc` : null} />
          <SpecRow
            label="Mileage"
            value={vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : null}
          />
          <SpecRow label="Fuel Type" value={vehicle.fuelType ? fuelLabel[vehicle.fuelType] : null} />
          <SpecRow label="Transmission" value={vehicle.transmission ? transLabel[vehicle.transmission] : null} />
          <SpecRow label="Condition" value={vehicle.condition ? conditionLabel[vehicle.condition] : null} />
          <SpecRow label="Days in Stock" value={`${days} days`} />
          {vehicle.notes && (
            <div className="py-3">
              <p className="mb-1 text-xs text-zinc-500">Notes</p>
              <p className="text-sm text-zinc-800 whitespace-pre-wrap">{vehicle.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Photos' && (
        <PhotoManager vehicleId={id} images={vehicle.images ?? []} />
      )}

      {activeTab === 'Documents' && (
        <DocumentManager vehicleId={id} documents={vehicle.documents ?? []} />
      )}

      {activeTab === 'Buy Record' && (
        <BuyRecordPanel vehicleId={id} purchasePrice={vehicle.purchasePrice} />
      )}

      {activeTab === 'Expenses' && (
        <ExpenseManager vehicleId={id} />
      )}

      {activeTab === 'Sell Record' && (
        <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center">
          <p className="text-sm text-zinc-500">Sell Record coming soon.</p>
        </div>
      )}
    </div>
  );
}
