'use client';

import Link from 'next/link';
import { useGetExpiringDocuments } from '@/hooks/use-alerts';
import type { ExpiryItem } from '@/hooks/use-alerts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  BLUE_BOOK: 'Blue Book',
  CMT: 'CMT',
  REVENUE_LICENCE: 'Revenue Licence',
  INSURANCE: 'Insurance',
  SIGNED_LETTER: 'Signed Letter',
  NIC: 'NIC',
  OTHER: 'Other',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  expired: {
    icon: '🔴',
    label: 'Expired',
    cardBg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700 ring-red-200',
    heading: 'text-red-800',
  },
  critical: {
    icon: '🟠',
    label: 'Critical — expires in 1 to 7 days',
    cardBg: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-700 ring-orange-200',
    heading: 'text-orange-800',
  },
  warning: {
    icon: '🟡',
    label: 'Warning — expires in 8 to 30 days',
    cardBg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700 ring-amber-200',
    heading: 'text-amber-800',
  },
} as const;

// ─── Alert card ───────────────────────────────────────────────────────────────

function AlertCard({
  item,
  urgency,
}: {
  item: ExpiryItem;
  urgency: keyof typeof URGENCY_CONFIG;
}) {
  const cfg = URGENCY_CONFIG[urgency];
  const vehicleName = `${item.vehicleMake} ${item.vehicleModel}`;

  return (
    <Link
      href={`/vehicles/${item.vehicleId}?tab=Documents`}
      className={`flex items-center gap-4 rounded-xl border ${cfg.cardBg} px-4 py-3.5 transition-opacity hover:opacity-80`}
    >
      <span className="text-xl leading-none shrink-0">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">
          {item.vehiclePlate ?? vehicleName}
          {item.vehiclePlate && (
            <span className="ml-1.5 text-xs text-zinc-500 font-normal">{vehicleName}</span>
          )}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">
          {DOC_TYPE_LABELS[item.docType] ?? item.docType} · Expires {formatDate(item.expiryDate)}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cfg.badge}`}>
        {item.daysRemaining <= 0 ? 'Expired' : `${item.daysRemaining}d left`}
      </span>
    </Link>
  );
}

// ─── Group section ────────────────────────────────────────────────────────────

function AlertGroup({
  urgency,
  items,
}: {
  urgency: keyof typeof URGENCY_CONFIG;
  items: ExpiryItem[];
}) {
  if (items.length === 0) return null;
  const cfg = URGENCY_CONFIG[urgency];

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base leading-none">{cfg.icon}</span>
        <h2 className={`text-sm font-semibold ${cfg.heading}`}>{cfg.label}</h2>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${cfg.badge}`}>
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <AlertCard key={item.docId} item={item} urgency={urgency} />
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { data: alerts, isLoading } = useGetExpiringDocuments();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Document Alerts</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Documents expiring within 30 days across all your vehicles
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : !alerts || alerts.totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16 text-center">
          <span className="text-4xl mb-3">✅</span>
          <p className="text-sm font-medium text-zinc-700">All clear</p>
          <p className="text-xs text-zinc-400 mt-1">
            No documents expiring in the next 30 days
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <AlertGroup urgency="expired" items={alerts.expired} />
          <AlertGroup urgency="critical" items={alerts.critical} />
          <AlertGroup urgency="warning" items={alerts.warning} />
        </div>
      )}
    </div>
  );
}
