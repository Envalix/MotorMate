'use client';

import { useState, useRef } from 'react';
import {
  useGetExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses';
import { useGetProfit } from '@/hooks/use-buy-record';
import type { Expense, ExpenseCategory } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<ExpenseCategory, { emoji: string; label: string }> = {
  TIRES:        { emoji: '🛞', label: 'Tires' },
  PAINT:        { emoji: '🎨', label: 'Paint' },
  ENGINE:       { emoji: '⚙️', label: 'Engine' },
  ELECTRICAL:   { emoji: '⚡', label: 'Electrical' },
  INTERIOR:     { emoji: '🪑', label: 'Interior' },
  REGISTRATION: { emoji: '📋', label: 'Registration' },
  TRANSPORT:    { emoji: '🚛', label: 'Transport' },
  CLEANING:     { emoji: '🧹', label: 'Cleaning' },
  OTHER:        { emoji: '📌', label: 'Other' },
};

function formatLKR(amount: string | number | null | undefined) {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
  return `Rs. ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Profit banner ────────────────────────────────────────────────────────────

function ProfitBanner({ vehicleId }: { vehicleId: string }) {
  const { data: profit } = useGetProfit(vehicleId);
  if (!profit) return null;

  const net = profit.netProfit != null ? Number.parseFloat(profit.netProfit) : null;
  const pct = profit.profitPercentage;
  const hasSell = profit.sellPrice != null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div>
          <span className="text-zinc-500">Buy price</span>
          <p className="font-semibold text-zinc-900 mt-0.5">{formatLKR(profit.buyPrice)}</p>
        </div>
        <div>
          <span className="text-zinc-500">Total expenses</span>
          <p className="font-semibold text-zinc-900 mt-0.5">{formatLKR(profit.totalExpenses)}</p>
        </div>
        {hasSell && (
          <div>
            <span className="text-zinc-500">Sell price</span>
            <p className="font-semibold text-zinc-900 mt-0.5">{formatLKR(profit.sellPrice)}</p>
          </div>
        )}
        {net != null && hasSell && (
          <div className="ml-auto text-right">
            <span className="text-zinc-500">Net profit</span>
            <p className={`font-bold mt-0.5 text-sm ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatLKR(net)}
              {pct != null && (
                <span className="ml-1 text-xs font-medium opacity-75">
                  ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                </span>
              )}
            </p>
          </div>
        )}
        {!hasSell && (
          <div className="ml-auto text-right">
            <span className="text-zinc-500">Status</span>
            <p className="font-medium text-zinc-400 mt-0.5 text-xs">Not sold yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Expense row ──────────────────────────────────────────────────────────────

function ExpenseRow({
  expense,
  onEdit,
  onDelete,
  deleting,
}: {
  expense: Expense;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const meta = CATEGORY_META[expense.category];
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-100 last:border-0">
      <span className="text-xl leading-none mt-0.5 shrink-0">{meta.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-zinc-900 truncate">{expense.description}</span>
          <span className="text-[10px] text-zinc-400 shrink-0">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {expense.vendor && (
            <span className="text-[10px] text-zinc-500 truncate">{expense.vendor}</span>
          )}
          <span className="text-[10px] text-zinc-400 shrink-0">{formatDate(expense.date)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-zinc-900">{formatLKR(expense.amount)}</span>
        <button
          onClick={() => onEdit(expense)}
          className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label="Edit expense"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          disabled={deleting}
          className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40"
          aria-label="Delete expense"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Expense form (used by add + edit modal) ──────────────────────────────────

interface ExpenseFormValues {
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  vendor: string;
  receipt: File | null;
}

function ExpenseForm({
  initial,
  onSubmit,
  isPending,
  onCancel,
  submitLabel,
}: {
  initial: ExpenseFormValues;
  onSubmit: (vals: ExpenseFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<ExpenseFormValues>(initial);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const fieldClass =
    'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200';
  const labelClass = 'block text-xs font-medium text-zinc-600 mb-1.5';

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Category *</label>
          <select
            required
            value={form.category}
            onChange={(e) => set('category', e.target.value as ExpenseCategory)}
            className={fieldClass}
          >
            {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Amount (LKR) *</label>
          <input
            type="number"
            min={0}
            step={0.01}
            required
            value={form.amount || ''}
            onChange={(e) => set('amount', Number.parseFloat(e.target.value) || 0)}
            className={fieldClass}
            placeholder="0.00"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description *</label>
          <input
            type="text"
            required
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className={fieldClass}
            placeholder="What was this expense for?"
          />
        </div>
        <div>
          <label className={labelClass}>Date *</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Vendor</label>
          <input
            type="text"
            value={form.vendor}
            onChange={(e) => set('vendor', e.target.value)}
            className={fieldClass}
            placeholder="Shop / mechanic name"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Receipt (optional)</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              {form.receipt ? 'Change image' : 'Attach image'}
            </button>
            {form.receipt && (
              <span className="text-xs text-zinc-500 truncate max-w-[200px]">{form.receipt.name}</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => set('receipt', e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {isPending && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Slide-up modal ───────────────────────────────────────────────────────────

function ExpenseModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ExpenseManager({
  vehicleId,
}: {
  vehicleId: string;
}) {
  const { data, isLoading } = useGetExpenses(vehicleId);
  const createMutation = useCreateExpense(vehicleId);
  const updateMutation = useUpdateExpense(vehicleId);
  const deleteMutation = useDeleteExpense(vehicleId);

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const expenses = data?.expenses ?? [];
  const total = data?.total ?? '0';

  const blankForm: ExpenseFormValues = {
    category: 'OTHER',
    description: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    vendor: '',
    receipt: null,
  };

  function handleCreate(vals: ExpenseFormValues) {
    createMutation.mutate(
      {
        category: vals.category,
        description: vals.description,
        amount: vals.amount,
        date: vals.date,
        vendor: vals.vendor || undefined,
        receipt: vals.receipt ?? undefined,
      },
      { onSuccess: () => setShowAdd(false) },
    );
  }

  function handleUpdate(vals: ExpenseFormValues) {
    if (!editTarget) return;
    updateMutation.mutate(
      {
        id: editTarget.id,
        category: vals.category,
        description: vals.description,
        amount: vals.amount,
        date: vals.date,
        vendor: vals.vendor || undefined,
        receipt: vals.receipt ?? undefined,
      },
      { onSuccess: () => setEditTarget(null) },
    );
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    deleteMutation.mutate(id, { onSettled: () => setDeletingId(null) });
  }

  return (
    <div className="space-y-5">
      {/* Profit / summary banner */}
      <ProfitBanner vehicleId={vehicleId} />

      {/* Expenses header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-700">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Total: <span className="font-semibold text-zinc-900">{formatLKR(total)}</span>
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Expense list */}
      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-10 text-center">
          <p className="text-2xl mb-2">🧾</p>
          <p className="text-xs font-medium text-zinc-500">No expenses yet</p>
          <p className="text-[11px] text-zinc-400 mt-1">Add expenses to track your total cost</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white px-4">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onEdit={(e) => setEditTarget(e)}
              onDelete={handleDelete}
              deleting={deletingId === expense.id}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <ExpenseModal title="Add Expense" onClose={() => setShowAdd(false)}>
          <ExpenseForm
            initial={blankForm}
            onSubmit={handleCreate}
            isPending={createMutation.isPending}
            onCancel={() => setShowAdd(false)}
            submitLabel="Add Expense"
          />
        </ExpenseModal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <ExpenseModal title="Edit Expense" onClose={() => setEditTarget(null)}>
          <ExpenseForm
            initial={{
              category: editTarget.category,
              description: editTarget.description,
              amount: Number.parseFloat(editTarget.amount),
              date: editTarget.date.slice(0, 10),
              vendor: editTarget.vendor ?? '',
              receipt: null,
            }}
            onSubmit={handleUpdate}
            isPending={updateMutation.isPending}
            onCancel={() => setEditTarget(null)}
            submitLabel="Save Changes"
          />
        </ExpenseModal>
      )}
    </div>
  );
}
