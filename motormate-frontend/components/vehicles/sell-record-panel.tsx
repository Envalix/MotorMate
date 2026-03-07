'use client';

import { useState } from 'react';
import { useGetSellRecord, useCreateSellRecord } from '@/hooks/use-sell-record';
import type { PaymentMethod, ProfitSummary, SellRecord } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLKR(amount: string | number | null | undefined) {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
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

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 py-2.5 last:border-0">
      <span className="text-xs text-zinc-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-zinc-900 text-right">{value ?? '—'}</span>
    </div>
  );
}

// ─── Profit card ──────────────────────────────────────────────────────────────

function ProfitCard({ profit }: { profit: ProfitSummary }) {
  const net = profit.netProfit != null ? Number.parseFloat(profit.netProfit) : null;
  const pct = profit.profitPercentage;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
      <p className="text-xs font-semibold text-zinc-600 mb-3">Profit Summary</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-zinc-500">Buy Price</p>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">{formatLKR(profit.buyPrice)}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500">Total Expenses</p>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">{formatLKR(profit.totalExpenses)}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500">Sell Price</p>
          <p className="text-sm font-semibold text-zinc-900 mt-0.5">{formatLKR(profit.sellPrice)}</p>
        </div>
        {net != null && (
          <div>
            <p className="text-[10px] text-zinc-500">Net Profit</p>
            <p className={`text-sm font-bold mt-0.5 ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatLKR(net)}
              {pct != null && (
                <span className="ml-1 text-[10px] font-medium opacity-75">
                  ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Read-only sold card ──────────────────────────────────────────────────────

function SoldCard({
  sellRecord,
  profit,
}: {
  sellRecord: SellRecord;
  profit: ProfitSummary;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
        <p className="text-xs font-medium text-zinc-700">
          Sold on {formatDate(sellRecord.saleDate)} — record is locked
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2">
        <InfoRow label="Selling Price" value={formatLKR(sellRecord.sellingPrice)} />
        <InfoRow label="Sale Date" value={formatDate(sellRecord.saleDate)} />
        <InfoRow
          label="Payment Method"
          value={sellRecord.paymentMethod ? PAYMENT_LABELS[sellRecord.paymentMethod] : null}
        />
        <InfoRow label="Buyer Name" value={sellRecord.buyerName} />
        <InfoRow label="Buyer NIC" value={sellRecord.buyerNic} />
        <InfoRow label="Buyer Contact" value={sellRecord.buyerContact} />
        <InfoRow label="Buyer Address" value={sellRecord.buyerAddress} />
        {sellRecord.notes && (
          <div className="py-2.5">
            <p className="text-xs text-zinc-500 mb-1">Notes</p>
            <p className="text-xs text-zinc-800 whitespace-pre-wrap">{sellRecord.notes}</p>
          </div>
        )}
      </div>

      <ProfitCard profit={profit} />
    </div>
  );
}

// ─── Mark-as-sold form ────────────────────────────────────────────────────────

function SellRecordForm({ vehicleId }: { vehicleId: string }) {
  const create = useCreateSellRecord(vehicleId);
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState({
    sellingPrice: 0,
    saleDate: new Date().toISOString().slice(0, 10),
    paymentMethod: '' as PaymentMethod | '',
    buyerName: '',
    buyerNic: '',
    buyerContact: '',
    buyerAddress: '',
    notes: '',
  });

  function set(key: keyof typeof form, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) return;
    create.mutate({
      sellingPrice: form.sellingPrice,
      saleDate: form.saleDate,
      paymentMethod: form.paymentMethod || undefined,
      buyerName: form.buyerName || undefined,
      buyerNic: form.buyerNic || undefined,
      buyerContact: form.buyerContact || undefined,
      buyerAddress: form.buyerAddress || undefined,
      notes: form.notes || undefined,
    });
  }

  const fieldClass =
    'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200';
  const labelClass = 'block text-xs font-medium text-zinc-600 mb-1.5';

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <span className="text-lg leading-none shrink-0">⚠️</span>
        <div>
          <p className="text-xs font-semibold text-amber-800">
            Once saved, ALL documents will be permanently locked
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Locked documents cannot be deleted. This action cannot be undone.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Selling Price (LKR) *</label>
            <input
              type="number"
              min={0}
              step={0.01}
              required
              value={form.sellingPrice || ''}
              onChange={(e) => set('sellingPrice', Number.parseFloat(e.target.value) || 0)}
              className={fieldClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelClass}>Sale Date *</label>
            <input
              type="date"
              required
              value={form.saleDate}
              onChange={(e) => set('saleDate', e.target.value)}
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
            <label className={labelClass}>Buyer Name</label>
            <input
              type="text"
              value={form.buyerName}
              onChange={(e) => set('buyerName', e.target.value)}
              className={fieldClass}
              placeholder="Full name"
            />
          </div>
          <div>
            <label className={labelClass}>Buyer NIC</label>
            <input
              type="text"
              value={form.buyerNic}
              onChange={(e) => set('buyerNic', e.target.value)}
              className={fieldClass}
              placeholder="NIC number"
            />
          </div>
          <div>
            <label className={labelClass}>Buyer Contact</label>
            <input
              type="text"
              value={form.buyerContact}
              onChange={(e) => set('buyerContact', e.target.value)}
              className={fieldClass}
              placeholder="Phone / email"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Buyer Address</label>
            <input
              type="text"
              value={form.buyerAddress}
              onChange={(e) => set('buyerAddress', e.target.value)}
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

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-zinc-900"
          />
          <span className="text-xs text-zinc-700">
            I understand that ALL documents for this vehicle will be{' '}
            <span className="font-semibold">permanently locked</span> and cannot be deleted after saving.
          </span>
        </label>

        <button
          type="submit"
          disabled={!confirmed || create.isPending}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {create.isPending && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {create.isPending ? 'Saving…' : 'Mark as Sold'}
        </button>
      </form>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SellRecordPanel({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useGetSellRecord(vehicleId);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
      </div>
    );
  }

  if (data) {
    return <SoldCard sellRecord={data.sellRecord} profit={data.profit} />;
  }

  return <SellRecordForm vehicleId={vehicleId} />;
}
