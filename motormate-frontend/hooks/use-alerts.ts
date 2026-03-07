'use client';

import { useGet } from '@/hooks/use-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExpiryItem {
  docId: string;
  vehicleId: string;
  vehiclePlate: string | null;
  vehicleMake: string;
  vehicleModel: string;
  docType: string;
  expiryDate: string;
  daysRemaining: number;
}

export interface ExpiryAlerts {
  expired: ExpiryItem[];
  critical: ExpiryItem[];
  warning: ExpiryItem[];
  totalCount: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGetExpiringDocuments() {
  return useGet<ExpiryAlerts>(
    ['alerts', 'expiring'],
    '/alerts/expiring',
  );
}
