'use client';

import { useState } from 'react';
import { useGetBuyRecord, useCreateBuyRecord } from '@/hooks/use-buy-record';
import type { PaymentMethod } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLKR(amount: string | number | null | undefined) {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  return `Rs. ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  FINANCING: 'Financing',
  OTHER: 'Other',
};

// ─── Field row (read-only) ────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 py-2.5 last:border-0">
      <span className="text-xs text-zinc-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-zinc-900 text-right">{value ?? '—'}</span>
    </div>
  );
}

// ─── Read-only summary card ───────────────────────────────────────────────────

function BuyRecordCard({ record }: { record: NonNullable<ReturnType<typeof useGetBuyRecord>['data']> }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
        <p className="text-xs font-medium text-zinc-700">Purchase recorded — this record is locked</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2">
        <InfoRow label="Purchase Price" value={formatLKR(record.purchasePrice)} />
        <InfoRow label="Purchase Date" value={formatDate(record.purchaseDate)} />
        <InfoRow
          label="Payment Method"
          value={record.paymentMethod ? PAYMENT_LABELS[record.paymentMethod] : null}
        />
        <InfoRow label="Seller Name" value={record.sellerName} />
        <InfoRow label="Seller NIC" value={record.sellerNic} />
        <InfoRow label="Seller Contact" value={record.sellerContact} />
        <InfoRow label="Seller Address" value={record.sellerAddress} />
        {record.notes && (
          <div className="py-2.5">
            <p className="text-xs text-zinc-500 mb-1">Notes</p>
            <p className="text-xs text-zinc-800 whitespace-pre-wrap">{record.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Record purchase form ─────────────────────────────────────────────────────

function BuyRecordForm({ vehicleId, defaultPrice }: { vehicleId: string; defaultPrice: string }) {
  const create = useCreateBuyRecord(vehicleId);
  const [form, setForm] = useState({
    purchasePrice: Number.parseFloat(defaultPrice) || 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: '' as PaymentMethod | '',
    sellerName: '',
    sellerNic: '',
    sellerContact: '',
    sellerAddress: '',
    notes: '',
  });

  function set(key: keyof typeof form, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      purchasePrice: form.purchasePrice,
      purchaseDate: form.purchaseDate,
      paymentMethod: form.paymentMethod || undefined,
      sellerName: form.sellerName || undefined,
      sellerNic: form.sellerNic || undefined,
      sellerContact: form.sellerContact || undefined,
      sellerAddress: form.sellerAddress || undefined,
      notes: form.notes || undefined,
    });
  }

  const fieldClass =
    'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200';
  const labelClass = 'block text-xs font-medium text-zinc-600 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Purchase Price (LKR) *</label>
          <input
            type="number"
            min={0}
            step={0.01}
            required
            value={form.purchasePrice || ''}
            onChange={(e) => set('purchasePrice', Number.parseFloat(e.target.value) || 0)}
            className={fieldClass}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelClass}>Purchase Date *</label>
          <input
            type="date"
            required
            value={form.purchaseDate}
            onChange={(e) => set('purchaseDate', e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Payment Method</label>
          <select
            value={form.paymentMethod}
            onChange={(e) => set('paymentMethod', e.target.value)}
            className={fieldClass}
          >
            <option value="">Select…</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="FINANCING">Financing</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Seller Name</label>
          <input
            type="text"
            value={form.sellerName}
            onChange={(e) => set('sellerName', e.target.value)}
            className={fieldClass}
            placeholder="Full name"
          />
        </div>
        <div>
          <label className={labelClass}>Seller NIC</label>
          <input
            type="text"
            value={form.sellerNic}
            onChange={(e) => set('sellerNic', e.target.value)}
            className={fieldClass}
            placeholder="NIC number"
          />
        </div>
        <div>
          <label className={labelClass}>Seller Contact</label>
          <input
            type="text"
            value={form.sellerContact}
            onChange={(e) => set('sellerContact', e.target.value)}
            className={fieldClass}
            placeholder="Phone / email"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Seller Address</label>
          <input
            type="text"
            value={form.sellerAddress}
            onChange={(e) => set('sellerAddress', e.target.value)}
            className={fieldClass}
            placeholder="Full address"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className={`${fieldClass} resize-none`}
            placeholder="Any additional notes…"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={create.isPending}
        className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {create.isPending && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {create.isPending ? 'Saving…' : 'Save Purchase Record'}
      </button>
      <p className="text-xs text-zinc-400">
        This record cannot be edited after saving.
      </p>
    </form>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function BuyRecordPanel({
  vehicleId,
  purchasePrice,
}: {
  vehicleId: string;
  purchasePrice: string;
}) {
  const { data: record, isLoading } = useGetBuyRecord(vehicleId);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
      </div>
    );
  }

  if (record) {
    return <BuyRecordCard record={record} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Record the purchase details for this vehicle. This cannot be edited after saving.
      </p>
      <BuyRecordForm vehicleId={vehicleId} defaultPrice={purchasePrice} />
    </div>
  );
}
