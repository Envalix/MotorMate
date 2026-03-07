'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useGet, usePost, usePut, useDelete } from '@/hooks/use-api';
import type { Vehicle, CreateVehicleInput, UpdateVehicleInput } from '@/types';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: (params?: { status?: string; search?: string }) =>
    ['vehicles', 'list', params] as const,
  detail: (id: string) => ['vehicles', id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useVehicles(params?: { status?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();

  return useGet<Vehicle[]>(
    vehicleKeys.list(params),
    `/vehicles${qs ? `?${qs}` : ''}`,
  );
}

export function useVehicle(id: string) {
  return useGet<Vehicle>(vehicleKeys.detail(id), `/vehicles/${id}`, {
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const router = useRouter();
  const qc = useQueryClient();

  return usePost<Vehicle, CreateVehicleInput>('/vehicles', {
    onSuccess(vehicle) {
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
      toast.success('Vehicle added successfully');
      router.push(`/vehicles/${vehicle.id}`);
    },
    onError() {
      toast.error('Failed to add vehicle. Please try again.');
    },
  });
}

export function useUpdateVehicle(id: string) {
  const router = useRouter();
  const qc = useQueryClient();

  return usePut<Vehicle, UpdateVehicleInput>(`/vehicles/${id}`, {
    onSuccess() {
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(id) });
      toast.success('Vehicle updated successfully');
      router.push(`/vehicles/${id}`);
    },
    onError() {
      toast.error('Failed to update vehicle. Please try again.');
    },
  });
}

export function useDeleteVehicle(id: string) {
  const router = useRouter();
  const qc = useQueryClient();

  return useDelete<Vehicle>(`/vehicles/${id}`, {
    onSuccess() {
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
      toast.success('Vehicle deleted');
      router.push('/vehicles');
    },
    onError() {
      toast.error('Failed to delete vehicle. Please try again.');
    },
  });
}
