'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useGet } from '@/hooks/use-api';
import { AxiosError } from 'axios';
import type { SellRecord, ProfitSummary, PaymentMethod } from '@/types';
import { vehicleKeys } from '@/hooks/use-vehicles';
import { buyRecordKeys } from '@/hooks/use-buy-record';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const sellRecordKeys = {
  detail: (vehicleId: string) => ['sell-record', vehicleId] as const,
};

// ─── Response shape from backend ─────────────────────────────────────────────

interface SellRecordResponse {
  sellRecord: SellRecord;
  profit: ProfitSummary;
}

// ─── Get sell record ──────────────────────────────────────────────────────────

export function useGetSellRecord(vehicleId: string) {
  return useGet<SellRecordResponse | null>(
    sellRecordKeys.detail(vehicleId),
    `/vehicles/${vehicleId}/sell-record`,
  );
}

// ─── Create sell record ───────────────────────────────────────────────────────

export interface CreateSellRecordPayload {
  sellingPrice: number;
  saleDate: string;
  paymentMethod?: PaymentMethod;
  buyerName?: string;
  buyerNic?: string;
  buyerContact?: string;
  buyerAddress?: string;
  notes?: string;
}

export function useCreateSellRecord(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation<SellRecordResponse, AxiosError, CreateSellRecordPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `/vehicles/${vehicleId}/sell-record`,
        payload,
      );
      return data;
    },
    onSuccess() {
      // Vehicle status → SOLD, documents locked, profit updated
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
      qc.invalidateQueries({ queryKey: sellRecordKeys.detail(vehicleId) });
      qc.invalidateQueries({ queryKey: buyRecordKeys.profit(vehicleId) });
      toast.success('Vehicle marked as sold — documents are now locked');
    },
    onError(err) {
      const msg =
        (err as AxiosError<{ message: string }>).response?.data?.message ??
        'Failed to save sell record';
      toast.error(msg);
    },
  });
}
