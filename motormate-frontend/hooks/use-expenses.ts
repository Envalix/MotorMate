'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useGet } from '@/hooks/use-api';
import { AxiosError } from 'axios';
import type { Expense, ExpenseCategory } from '@/types';
import { buyRecordKeys } from '@/hooks/use-buy-record';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const expenseKeys = {
  list: (vehicleId: string) => ['expenses', vehicleId] as const,
};

// ─── List expenses + running total ───────────────────────────────────────────

export function useGetExpenses(vehicleId: string) {
  return useGet<{ expenses: Expense[]; total: string }>(
    expenseKeys.list(vehicleId),
    `/vehicles/${vehicleId}/expenses`,
  );
}

// ─── Create expense ───────────────────────────────────────────────────────────

export interface CreateExpensePayload {
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  receipt?: File;
}

export function useCreateExpense(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation<Expense, AxiosError, CreateExpensePayload>({
    mutationFn: async ({ receipt, ...rest }) => {
      const formData = new FormData();
      formData.append('category', rest.category);
      formData.append('description', rest.description);
      formData.append('amount', String(rest.amount));
      formData.append('date', rest.date);
      if (rest.vendor) formData.append('vendor', rest.vendor);
      if (receipt) formData.append('receipt', receipt);

      const { data } = await api.post(
        `/vehicles/${vehicleId}/expenses`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: expenseKeys.list(vehicleId) });
      qc.invalidateQueries({ queryKey: buyRecordKeys.profit(vehicleId) });
      toast.success('Expense added');
    },
    onError(err) {
      const msg =
        (err as AxiosError<{ message: string }>).response?.data?.message ??
        'Failed to add expense';
      toast.error(msg);
    },
  });
}

// ─── Update expense ───────────────────────────────────────────────────────────

export interface UpdateExpensePayload {
  id: string;
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
  date?: string;
  vendor?: string;
  receipt?: File;
}

export function useUpdateExpense(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation<Expense, AxiosError, UpdateExpensePayload>({
    mutationFn: async ({ id, receipt, ...rest }) => {
      const formData = new FormData();
      if (rest.category) formData.append('category', rest.category);
      if (rest.description) formData.append('description', rest.description);
      if (rest.amount !== undefined) formData.append('amount', String(rest.amount));
      if (rest.date) formData.append('date', rest.date);
      if (rest.vendor !== undefined) formData.append('vendor', rest.vendor);
      if (receipt) formData.append('receipt', receipt);

      const { data } = await api.put(
        `/expenses/${id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: expenseKeys.list(vehicleId) });
      qc.invalidateQueries({ queryKey: buyRecordKeys.profit(vehicleId) });
      toast.success('Expense updated');
    },
    onError(err) {
      const msg =
        (err as AxiosError<{ message: string }>).response?.data?.message ??
        'Failed to update expense';
      toast.error(msg);
    },
  });
}

// ─── Delete expense ───────────────────────────────────────────────────────────

export function useDeleteExpense(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, AxiosError, string>({
    mutationFn: async (expenseId) => {
      const { data } = await api.delete(`/expenses/${expenseId}`);
      return data;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: expenseKeys.list(vehicleId) });
      qc.invalidateQueries({ queryKey: buyRecordKeys.profit(vehicleId) });
      toast.success('Expense deleted');
    },
    onError() {
      toast.error('Failed to delete expense');
    },
  });
}
