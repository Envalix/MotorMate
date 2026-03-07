'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';
import type { VehicleDocument, DocumentType } from '@/types';
import { vehicleKeys } from '@/hooks/use-vehicles';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

export interface UploadDocumentPayload {
  files: File[];
  docType: DocumentType;
  expiryDate?: string;
  onProgress: (items: DocUploadProgress[]) => void;
}

// ─── Upload documents (one at a time with progress) ───────────────────────────

export function useUploadDocuments(vehicleId: string) {
  const qc = useQueryClient();

  return useMutation<VehicleDocument[], AxiosError, UploadDocumentPayload>({
    mutationFn: async ({ files, docType, expiryDate, onProgress }) => {
      const progressMap: DocUploadProgress[] = files.map((f) => ({
        fileId: Math.random().toString(36).slice(2),
        fileName: f.name,
        progress: 0,
        status: 'uploading',
      }));

      onProgress([...progressMap]);

      const results: VehicleDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const item = progressMap[i];

        try {
          const formData = new FormData();
          formData.append('files', file);
          formData.append('docType', docType);
          if (expiryDate) formData.append('expiryDate', expiryDate);

          const { data } = await api.post<VehicleDocument[]>(
            `/vehicles/${vehicleId}/documents`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress(e) {
                item.progress = e.total
                  ? Math.round((e.loaded / e.total) * 100)
                  : 50;
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
      toast.success('Document(s) uploaded');
    },
    onError() {
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
    },
  });
}

// ─── Delete document ──────────────────────────────────────────────────────────

export function useDeleteDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, AxiosError, string>({
    mutationFn: async (docId) => {
      const { data } = await api.delete(
        `/vehicles/${vehicleId}/documents/${docId}`,
      );
      return data;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
      toast.success('Document deleted');
    },
    onError(err) {
      const msg =
        (err as AxiosError<{ message: string }>).response?.data?.message ??
        'Failed to delete document';
      toast.error(msg);
    },
  });
}

// ─── Get signed download URL ──────────────────────────────────────────────────

export function useDocumentDownload(vehicleId: string) {
  return useMutation<{ url: string; name: string }, AxiosError, string>({
    mutationFn: async (docId) => {
      const { data } = await api.get(
        `/vehicles/${vehicleId}/documents/${docId}/download`,
      );
      return data;
    },
    onError() {
      toast.error('Failed to get download link');
    },
  });
}

// ─── Create sell record (triggers document lock) ──────────────────────────────

export interface CreateSellRecordPayload {
  sellingPrice: number;
  saleDate: string;
  paymentMethod?: string;
  buyerName?: string;
  buyerContact?: string;
  notes?: string;
}

export function useCreateSellRecord(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, AxiosError, CreateSellRecordPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `/vehicles/${vehicleId}/sell-record`,
        payload,
      );
      return data;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
      toast.success('Sell record saved — documents are now locked');
    },
    onError(err) {
      const msg =
        (err as AxiosError<{ message: string }>).response?.data?.message ??
        'Failed to save sell record';
      toast.error(msg);
    },
  });
}
