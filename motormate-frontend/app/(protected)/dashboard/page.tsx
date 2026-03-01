'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  useGetDashboardSummary,
  useGetAging,
  useGetProfitByMonth,
  useGetExpenseByCategory,
} from '@/hooks/use-dashboard';
import { useGetExpiringDocuments } from '@/hooks/use-alerts';
import { useMe } from '@/hooks/use-auth';
import type { AgingVehicle, ExpenseByCategory } from '@/hooks/use-dashboard';
import type { ExpiryItem } from '@/hooks/use-alerts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLKR(amount: string | number | null | undefined) {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
  return `Rs. ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLKRShort(amount: number) {
  if (amount >= 1_000_000) return `Rs.${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rs.${(amount / 1_000).toFixed(0)}K`;
  return `Rs.${amount.toFixed(0)}`;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color = 'zinc',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: 'zinc' | 'emerald' | 'amber' | 'blue';
}) {
  const accent: Record<string, string> = {
    zinc: 'text-zinc-900',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold truncate ${accent[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold text-zinc-900 mb-3">{title}</h2>;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-100 ${className}`} />;
}

// ─── Inventory aging table ────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  BLUE_BOOK: 'Blue Book',
  CMT: 'CMT',
  REVENUE_LICENCE: 'Revenue Licence',
  INSURANCE: 'Insurance',
  SIGNED_LETTER: 'Signed Letter',
  NIC: 'NIC',
  OTHER: 'Other',
};

function AgingTable({ vehicles }: { vehicles: AgingVehicle[] }) {
  const router = useRouter();

  if (vehicles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center">
        <p className="text-xs text-zinc-400">No in-stock vehicles</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-100 text-left">
            <th className="px-4 py-3 font-medium text-zinc-500">Vehicle</th>
            <th className="px-4 py-3 font-medium text-zinc-500 hidden sm:table-cell">Plate / VIN</th>
            <th className="px-4 py-3 font-medium text-zinc-500 hidden md:table-cell">Asking</th>
            <th className="px-4 py-3 font-medium text-zinc-500 text-right">Days Unsold</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => {
            const stale = v.daysInStock >= 30;
            return (
              <tr
                key={v.id}
                onClick={() => router.push(`/vehicles/${v.id}`)}
                className={`border-b border-zinc-100 last:border-0 cursor-pointer transition-colors hover:bg-zinc-50 ${
                  stale ? 'bg-red-50 hover:bg-red-100' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {v.imageUrl ? (
                      <img
                        src={v.imageUrl}
                        alt=""
                        className="h-9 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-zinc-100 shrink-0">
                        <span className="text-base">🚗</span>
                      </div>
                    )}
                    <span className={`font-medium ${stale ? 'text-red-700' : 'text-zinc-900'}`}>
                      {v.year} {v.make} {v.model}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">
                  {v.plateNumber ?? v.vin ?? '—'}
                </td>
                <td className="px-4 py-3 text-zinc-700 hidden md:table-cell">
                  {formatLKR(v.sellingPrice ?? v.purchasePrice)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ring-1 ${
                      stale
                        ? 'bg-red-100 text-red-700 ring-red-200'
                        : 'bg-zinc-100 text-zinc-600 ring-zinc-200'
                    }`}
                  >
                    {v.daysInStock}d
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Category pie chart colors ────────────────────────────────────────────────

const PIE_COLORS = [
  '#18181b', '#3f3f46', '#52525b', '#71717a',
  '#a1a1aa', '#d4d4d8', '#e4e4e7', '#f4f4f5',
];

function ExpensePieChart({ data }: { data: ExpenseByCategory[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-xs text-zinc-400">No expenses recorded yet</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.category.charAt(0) + d.category.slice(1).toLowerCase(),
    value: Number.parseFloat(d.total),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={40}
          paddingAngle={2}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number | undefined) => formatLKR(v)}
          contentStyle={{ fontSize: 11, borderRadius: 8 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Urgency colors ───────────────────────────────────────────────────────────

const URGENCY = {
  expired: { dot: '🔴', label: 'Expired', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700 ring-red-200' },
  critical: { dot: '🟠', label: 'Critical (1–7d)', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700 ring-orange-200' },
  warning: { dot: '🟡', label: 'Warning (8–30d)', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700 ring-amber-200' },
} as const;

function AlertItem({ item, urgency }: { item: ExpiryItem; urgency: keyof typeof URGENCY }) {
  const u = URGENCY[urgency];
  const vehicleName = `${item.vehicleMake} ${item.vehicleModel}`;
  return (
    <Link
      href={`/vehicles/${item.vehicleId}?tab=Documents`}
      className={`flex items-center gap-3 rounded-lg ${u.bg} px-3 py-2.5 transition-opacity hover:opacity-80`}
    >
      <span className="text-base leading-none shrink-0">{u.dot}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-900 truncate">
          {item.vehiclePlate ?? vehicleName}
        </p>
        <p className="text-[10px] text-zinc-500">
          {DOC_TYPE_LABELS[item.docType] ?? item.docType}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${u.badge}`}>
        {item.daysRemaining <= 0 ? 'Expired' : `${item.daysRemaining}d`}
      </span>
    </Link>
  );
}

function AlertsPanel() {
  const { data: alerts, isLoading } = useGetExpiringDocuments();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
      </div>
    );
  }

  if (!alerts || alerts.totalCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center">
        <p className="text-xl mb-1">✅</p>
        <p className="text-xs text-zinc-400">No expiring documents</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {alerts.expired.map((item) => (
        <AlertItem key={item.docId} item={item} urgency="expired" />
      ))}
      {alerts.critical.map((item) => (
        <AlertItem key={item.docId} item={item} urgency="critical" />
      ))}
      {alerts.warning.map((item) => (
        <AlertItem key={item.docId} item={item} urgency="warning" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: user } = useMe();
  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary();
  const { data: aging, isLoading: agingLoading } = useGetAging();
  const { data: profitMonths, isLoading: profitLoading } = useGetProfitByMonth();
  const { data: expenseCategories, isLoading: expLoading } = useGetExpenseByCategory();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">
          {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">Your inventory at a glance</p>
      </div>

      {/* KPI cards */}
      {sumLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-8">
          <KpiCard
            label="Total Inventory Value"
            value={formatLKR(summary?.totalInventoryValue)}
            sub="in-stock asking prices"
            color="zinc"
          />
          <KpiCard
            label="Vehicles In Stock"
            value={String(summary?.inStockCount ?? 0)}
            sub="available now"
            color="emerald"
          />
          <KpiCard
            label="Sold This Month"
            value={String(summary?.soldThisMonth ?? 0)}
            color="blue"
          />
          <KpiCard
            label="Avg Net Profit"
            value={formatLKR(summary?.avgNetProfit)}
            sub="per vehicle sold"
            color={
              summary?.avgNetProfit
                ? Number.parseFloat(summary.avgNetProfit) >= 0
                  ? 'emerald'
                  : 'amber'
                : 'zinc'
            }
          />
        </div>
      )}

      {/* Main 2-column grid (desktop) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

        {/* Left column */}
        <div className="space-y-6">

          {/* Aging table */}
          <section>
            <SectionHeading title="Inventory Aging" />
            {agingLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <AgingTable vehicles={aging ?? []} />
            )}
          </section>

          {/* Monthly profit chart */}
          <section>
            <SectionHeading title="Monthly Net Profit" />
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              {profitLoading ? (
                <Skeleton className="h-48" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={profitMonths ?? []}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatLKRShort}
                      tick={{ fontSize: 10, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip
                      formatter={(v: number | undefined) => [formatLKR(v), 'Net Profit']}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Bar
                      dataKey="netProfit"
                      radius={[4, 4, 0, 0]}
                      fill="#18181b"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Expense pie chart */}
          <section>
            <SectionHeading title="Expenses by Category" />
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              {expLoading ? (
                <Skeleton className="h-48" />
              ) : (
                <ExpensePieChart data={expenseCategories ?? []} />
              )}
            </div>
          </section>
        </div>

        {/* Right column — alerts */}
        <div>
          <SectionHeading title="Document Expiry Alerts" />
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}
