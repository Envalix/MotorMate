'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import type { Vehicle, VehicleType } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const vehicleSchema = z.object({
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'SUV', 'BUS', 'OTHER']).optional(),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be ≥ 1900')
    .max(2100, 'Year must be ≤ 2100'),
  vin: z.string().optional(),
  plateNumber: z.string().optional(),
  color: z.string().optional(),
  engineCC: z
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.literal(NaN).transform(() => undefined)),
  mileage: z
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.literal(NaN).transform(() => undefined)),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'OTHER']).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'OTHER']).optional(),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
  purchasePrice: z.number().min(0, 'Must be ≥ 0'),
  sellingPrice: z
    .number()
    .min(0)
    .optional()
    .or(z.literal(NaN).transform(() => undefined)),
  notes: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

// ─── Vehicle type picker data ─────────────────────────────────────────────────

const VEHICLE_TYPES: { value: VehicleType; label: string; emoji: string }[] = [
  { value: 'CAR',        label: 'Car',       emoji: '🚗' },
  { value: 'MOTORCYCLE', label: 'Motorcycle', emoji: '🏍️' },
  { value: 'SUV',        label: 'SUV',        emoji: '🚙' },
  { value: 'VAN',        label: 'Van',        emoji: '🚐' },
  { value: 'TRUCK',      label: 'Truck',      emoji: '🚛' },
  { value: 'BUS',        label: 'Bus',        emoji: '🚌' },
  { value: 'OTHER',      label: 'Other',      emoji: '🚘' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  defaultValues?: Partial<VehicleFormValues>;
  onSubmit: (values: VehicleFormValues) => void;
  isPending: boolean;
  cancelHref: string;
  submitLabel: string;
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-zinc-600">
      {children}
    </label>
  );
}

function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        {...props}
        className={`w-full rounded-lg border bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-zinc-200 ${
          error ? 'border-red-300 focus:border-red-400' : 'border-zinc-200 focus:border-zinc-400'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Select({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <div>
      <select
        {...props}
        className={`w-full rounded-lg border bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-zinc-200 ${
          error ? 'border-red-300 focus:border-red-400' : 'border-zinc-200 focus:border-zinc-400'
        }`}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function VehicleForm({ defaultValues, onSubmit, isPending, cancelHref, submitLabel }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

      {/* ── Vehicle Type picker ── */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Vehicle Type</h2>
        <Controller
          name="vehicleType"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {VEHICLE_TYPES.map(({ value, label, emoji }) => {
                const selected = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(selected ? undefined : value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-3 transition-all ${
                      selected
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white'
                    }`}
                  >
                    <span className="text-2xl leading-none">{emoji}</span>
                    <span className="text-[10px] font-medium leading-none">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
      </section>

      {/* ── Identity ── */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              placeholder="e.g. Toyota"
              error={errors.make?.message}
              {...register('make')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              placeholder="e.g. Corolla"
              error={errors.model?.message}
              {...register('model')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              type="number"
              placeholder="e.g. 2022"
              error={errors.year?.message}
              {...register('year', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Colour</Label>
            <Input
              id="color"
              placeholder="e.g. Pearl White"
              {...register('color')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plateNumber">Plate Number</Label>
            <Input
              id="plateNumber"
              placeholder="e.g. CAA-1234"
              {...register('plateNumber')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vin">Chassis / VIN</Label>
            <Input
              id="vin"
              placeholder="e.g. JN1BJ0HP0FW100001"
              {...register('vin')}
            />
          </div>
        </div>
      </section>

      {/* ── Specifications ── */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Specifications</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="engineCC">Engine CC</Label>
            <Input
              id="engineCC"
              type="number"
              min={0}
              placeholder="e.g. 1800"
              error={errors.engineCC?.message}
              {...register('engineCC', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mileage">Mileage (km)</Label>
            <Input
              id="mileage"
              type="number"
              min={0}
              placeholder="e.g. 45000"
              error={errors.mileage?.message}
              {...register('mileage', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select id="fuelType" {...register('fuelType')}>
              <option value="">Select…</option>
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="ELECTRIC">Electric</option>
              <option value="HYBRID">Hybrid</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transmission">Transmission</Label>
            <Select id="transmission" {...register('transmission')}>
              <option value="">Select…</option>
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATIC">Automatic</option>
              <option value="CVT">CVT</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="condition">Condition</Label>
            <Select id="condition" {...register('condition')}>
              <option value="">Select…</option>
              <option value="NEW">New</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Pricing (LKR)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="purchasePrice">Purchase Price *</Label>
            <Input
              id="purchasePrice"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              error={errors.purchasePrice?.message}
              {...register('purchasePrice', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sellingPrice">Asking Price</Label>
            <Input
              id="sellingPrice"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              error={errors.sellingPrice?.message}
              {...register('sellingPrice', { valueAsNumber: true })}
            />
          </div>
        </div>
      </section>

      {/* ── Notes ── */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Notes</h2>
        <textarea
          id="notes"
          rows={3}
          placeholder="Any additional information about the vehicle…"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200"
          {...register('notes')}
        />
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pb-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

// ─── Helper to build default values from an existing vehicle ─────────────────

export function vehicleToFormValues(v: Vehicle): Partial<VehicleFormValues> {
  return {
    vehicleType: v.vehicleType ?? undefined,
    make: v.make,
    model: v.model,
    year: v.year,
    vin: v.vin ?? undefined,
    plateNumber: v.plateNumber ?? undefined,
    color: v.color ?? undefined,
    engineCC: v.engineCC ?? undefined,
    mileage: v.mileage ?? undefined,
    fuelType: v.fuelType ?? undefined,
    transmission: v.transmission ?? undefined,
    condition: v.condition ?? undefined,
    purchasePrice: parseFloat(v.purchasePrice),
    sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : undefined,
    notes: v.notes ?? undefined,
  };
}
