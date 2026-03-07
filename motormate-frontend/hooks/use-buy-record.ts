'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useGet } from '@/hooks/use-api';
import { AxiosError } from 'axios';
import type { BuyRecord, PaymentMethod, ProfitSummary } from '@/types';
import { vehicleKeys } from '@/hooks/use-vehicles';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const buyRecordKeys = {
  detail: (vehicleId: string) => ['buy-record', vehicleId] as const,
  profit: (vehicleId: string) => ['profit', vehicleId] as const,
};

// ─── Get buy record ───────────────────────────────────────────────────────────

export function useGetBuyRecord(vehicleId: string) {
  return useGet<BuyRecord | null>(
    buyRecordKeys.detail(vehicleId),
    `/vehicles/${vehicleId}/buy-record`,
  );
}

// ─── Get profit summary ───────────────────────────────────────────────────────

export function useGetProfit(vehicleId: string) {
  return useGet<ProfitSummary>(
    buyRecordKeys.profit(vehicleId),
    `/vehicles/${vehicleId}/buy-record/profit`,
  );
}

// ─── Create buy record ────────────────────────────────────────────────────────

export interface CreateBuyRecordPayload {
  purchasePrice: number;
  purchaseDate: string;
  paymentMethod?: PaymentMethod;
  sellerName?: string;
  sellerNic?: string;
  sellerContact?: string;
  sellerAddress?: string;
  notes?: string;
}

export function useCreateBuyRecord(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation<BuyRecord, AxiosError, CreateBuyRecordPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `/vehicles/${vehicleId}/buy-record`,
        payload,
      );
      return data;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: buyRecordKeys.detail(vehicleId) });
      qc.invalidateQueries({ queryKey: buyRecordKeys.profit(vehicleId) });
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
      toast.success('Buy record saved');
    },
    onError(err) {
      const msg =
        (err as AxiosError<{ message: string }>).response?.data?.message ??
        'Failed to save buy record';
      toast.error(msg);
    },
  });
}
