'use client';

import { use } from 'react';
import Link from 'next/link';
import { VehicleForm, vehicleToFormValues } from '@/components/vehicles/vehicle-form';
import type { VehicleFormValues } from '@/components/vehicles/vehicle-form';
import { useVehicle, useUpdateVehicle } from '@/hooks/use-vehicles';

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: vehicle, isLoading, isError } = useVehicle(id);
  const update = useUpdateVehicle(id);

  function handleSubmit(values: VehicleFormValues) {
    update.mutate(values as Parameters<typeof update.mutate>[0]);
  }

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/vehicles/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
          aria-label="Back"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Edit Vehicle</h1>
          <p className="text-xs text-zinc-500">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
        </div>
      </div>

      <VehicleForm
        defaultValues={vehicleToFormValues(vehicle)}
        onSubmit={handleSubmit}
        isPending={update.isPending}
        cancelHref={`/vehicles/${id}`}
        submitLabel="Save Changes"
      />
    </div>
  );
}
