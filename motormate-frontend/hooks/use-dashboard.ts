'use client';

import { useGet } from '@/hooks/use-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalInventoryValue: string;
  inStockCount: number;
  soldThisMonth: number;
  avgNetProfit: string | null;
}

export interface AgingVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string | null;
  vin: string | null;
  purchasePrice: string;
  sellingPrice: string | null;
  imageUrl: string | null;
  daysInStock: number;
}

export interface ProfitByMonth {
  month: string;   // "YYYY-MM"
  label: string;   // "Jan '25"
  netProfit: number;
}

export interface ExpenseByCategory {
  category: string;
  total: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useGetDashboardSummary() {
  return useGet<DashboardSummary>(
    ['dashboard', 'summary'],
    '/dashboard/summary',
  );
}

export function useGetAging() {
  return useGet<AgingVehicle[]>(
    ['dashboard', 'aging'],
    '/dashboard/aging',
  );
}

export function useGetProfitByMonth() {
  return useGet<ProfitByMonth[]>(
    ['dashboard', 'profit-by-month'],
    '/dashboard/profit-by-month',
  );
}

export function useGetExpenseByCategory() {
  return useGet<ExpenseByCategory[]>(
    ['dashboard', 'expense-by-category'],
    '/dashboard/expense-by-category',
  );
}
