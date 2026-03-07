'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import type { VehicleImage } from '@/types';
import { vehicleKeys } from '@/hooks/use-vehicles';

// ─── Upload (one file at a time with progress) ────────────────────────────────

export interface UploadProgress {
  fileId: string;       // client-side temp ID
  fileName: string;
  progress: number;     // 0-100
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

export function useUploadImages(vehicleId: string) {
  const qc = useQueryClient();

  return useMutation<VehicleImage[], AxiosError, { files: File[]; onProgress: (p: UploadProgress[]) => void }>({
    mutationFn: async ({ files, onProgress }) => {
      const progressMap: UploadProgress[] = files.map((f) => ({
        fileId: Math.random().toString(36).slice(2),
        fileName: f.name,
        progress: 0,
        status: 'uploading',
      }));

      onProgress([...progressMap]);

      const results: VehicleImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const item = progressMap[i];

        try {
          const formData = new FormData();
          formData.append('files', file);

          const { data } = await api.post<VehicleImage[]>(
            `/vehicles/${vehicleId}/images`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress(e) {
                item.progress = e.total ? Math.round((e.loaded / e.total) * 100) : 50;
                onProgress([...progressMap]);
              },
            },
          );

          item.progress = 100;
          item.status = 'done';
          onProgress([...progressMap]);
          results.push(...data);
        } catch (err) {
          const msg =
            (err as AxiosError<{ message: string }>).response?.data?.message ??
            'Upload failed';
          item.status = 'error';
          item.error = msg;
          onProgress([...progressMap]);
        }
      }

      return results;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
      toast.success('Photos uploaded');
    },
    onError() {
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
    },
  });
}

// ─── Set primary ──────────────────────────────────────────────────────────────

export function useSetPrimary(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, AxiosError, string>({
    mutationFn: async (imgId) => {
      const { data } = await api.patch(`/vehicles/${vehicleId}/images/${imgId}/primary`);
      return data;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
    },
    onError() {
      toast.error('Failed to set primary photo');
    },
  });
}

// ─── Delete image ─────────────────────────────────────────────────────────────

export function useDeleteImage(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, AxiosError, string>({
    mutationFn: async (imgId) => {
      const { data } = await api.delete(`/vehicles/${vehicleId}/images/${imgId}`);
      return data;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
      toast.success('Photo deleted');
    },
    onError() {
      toast.error('Failed to delete photo');
    },
  });
}
