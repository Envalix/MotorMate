'use client';

import Link from 'next/link';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import type { VehicleFormValues } from '@/components/vehicles/vehicle-form';
import { useCreateVehicle } from '@/hooks/use-vehicles';

export default function NewVehiclePage() {
  const create = useCreateVehicle();

  function handleSubmit(values: VehicleFormValues) {
    create.mutate(values as Parameters<typeof create.mutate>[0]);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/vehicles"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
          aria-label="Back"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Add Vehicle</h1>
          <p className="text-xs text-zinc-500">Fill in the details for your new vehicle</p>
        </div>
      </div>

      <VehicleForm
        onSubmit={handleSubmit}
        isPending={create.isPending}
        cancelHref="/vehicles"
        submitLabel="Add Vehicle"
      />
    </div>
  );
}
